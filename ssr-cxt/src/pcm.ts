const {
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} = require("@azure/storage-blob");
import { PassThrough, Readable, Transform, Writable } from "stream";
import { ServerResponse } from "http";

const containerName = "$web";

const ws = BlobServiceClient.fromConnectionString(
  "DefaultEndpointsProtocol=https;AccountName=grepmusic;AccountKey=OOmiLHvrARhZKbsBA3EF1gZDyqScQbIwk5B7zukyJcbUrSW4pHd08uxME3+QZ6aSIZm2YdLzb8OOqTW1Gow09w==;EndpointSuffix=core.windows.net"
);
const midiContainer = ws.getContainerClient("$web");
export const listContainers = () => ws.listContainers();
export const listFiles2 = (prefix) => {
  const gen = midiContainer.listBlobsFlat({ prefix });
  return Readable.from(gen, {
    objectMode: true,
  }).pipe(
    new Transform({
      objectMode: true,
      transform: (chunk, enc, cb) => {
        const { name, properties } = chunk;
        const { createdOn, contentType, contentLength } = properties;
        const url = midiContainer.getBlobClient(name).url;
        cb(null, [name, url, createdOn, contentLength, contentType].join(", "));
      },
    })
  );
};
export const listFiles = async (prefix) => {
  const files = [];
  for await (const file of await midiContainer.listBlobsFlat({ prefix })) {
    files.push(file);
  }
  return files;
};
export const download = async (filename) => {
  const c = midiContainer.getBlobClient(filename);
  return readBuffer(await c.downloadToBuffer());
};

function readBuffer(buffer: Buffer) {
  let offset = 0;
  const dv = new DataView(buffer);
  const fgetc = () => dv.getUint8(offset++);
  const btoa = () => String.fromCharCode(fgetc());
  const read32 = () =>
    (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const read16 = () => (fgetc() << 8) | fgetc();
  const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const fgets = (n: number) => (n > 1 ? btoa() + fgets(n - 1) : btoa());
  const fgetnc = (n: number) =>
    n > 1 ? fgetnc(n - 1).concat(fgetc()) : [fgetc()];
  const readVarLength = () => {
    let v = 0;
    let n = fgetc();
    v = n & 0x7f;
    while (n & 0x80) {
      n = fgetc();
      v = (v << 7) | (n & 0x7f);
    }
    return v;
  };
  const output = [];
  const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
  const headerLength = read32();
  const format = read16();
  const ntracks = read16();
  const division = read16();
  output.push([chunkType, headerLength, format, ntracks, division].join(","));
  let lastHeader = "";

  while (offset < buffer.byteLength) {
    const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
    let mhrkLength = read32();
    output.push(["#section", mhrk, mhrkLength].join(","));
    const endOfChunk = offset + mhrkLength;
    while (offset < endOfChunk) {
      const deltaTime = readVarLength();
      const msg = fgetc();
      let meta;
      let info = [];
      if (msg == 0xff) {
        meta = fgetc();
        var len = readVarLength();
        let cmd = "";
        switch (meta) {
          case 0x01:
          case 0x02:
          case 0x03:
          case 0x05:
          case 0x06:
          case 0x07:
            info.push(fgets(len));
            cmd = "etc";
            break;
          case 0x04:
            info.push(fgets(len));
            cmd = "instrument";
            break;
          case 0x51:
            info.push(" tempo:" + read24());
            cmd = "tempo";
            break;
          case 0x54:
            const [framerateAndhour, min, sec, frame, subframe] = [
              fgetc(),
              fgetc(),
              fgetc(),
              fgetc(),
              fgetc(),
            ];
            const framerate = [24, 25, 29, 30][framerateAndhour & 0x60];
            const hour = framerate & 0x1f;
            info = JSON.stringify({
              framerate,
              hour,
              min,
              sec,
              frame,
              subframe,
            }).split(/,s+/);
            break;
          case 0x58:
            cmd = "timesig";
            info.push({
              qnpm: fgetc(),
              beat: fgetc(),
            });
            info.push({
              ticks: fgetc(),
              measure: fgetc(),
            });

            break;
          case 0x59:
            info.push({
              scale: dv.getInt8(offset++),
            });
            info.push({
              majminor: dv.getUint8(offset++),
            });
            cmd = "note pitch change";
            break;
          case 0x2f:
            //END OF TRACK;
            break;
          default:
            cmd = "unkown " + meta;
            info.push({ "type:": meta, info: fgets(len) });
        }
        output.push(
          [deltaTime, cmd || "cmd", info.map((t) => JSON.stringify(t))].join(
            ","
          )
        );
      } else if (msg == 0xf0) {
        var length = readVarLength();
        output.push(["sysEx", ...fgetnc(length)]);
      } else if (msg == 0xf7) {
        var length = readVarLength();
        output.push(["systex", ...fgetnc(length)]);
      } else if (msg > 0x80) {
        if (!lastHeader) {
          output.push("#deltaTime, channel, action, additional ");
          lastHeader = "#deltaTime, channel, action, additional ";
        }
        const channel = msg & 0x0f;
        const cmd = msg >> 4;

        const keys = [
          "keyoff",
          "keyon",
          "aftertouch",
          "ccontrolchange",
          "pgmchange",
          "channel aftertouch max",
          "pw",
        ];
        const action = keys[cmd - 8];
        const additional = readVarLength();
        output.push([deltaTime, channel, action, additional].join(","));
      }
    }
  }
}

const list = listFiles("midifiles");
console.log(list);
console.log(download(list[0].name));
