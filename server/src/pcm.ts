import {
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} from "@azure/storage-blob";
import { PassThrough, Readable, Transform, Writable } from "stream";
import { BlobService, createBlobService, ErrorOrResult } from "azure-storage";
import { ServerResponse } from "http";
const service = createBlobService(process.env.AZ_CONN_STR);
const containerName = "$web";
export function listFiles(prefix = null, limit = 50) {
  const readable = new PassThrough({
    objectMode: true,
  });
  let nextPage = null;
  service.listBlobsSegmentedWithPrefix(
    containerName,
    prefix,
    nextPage,
    (err, result) => {
      if (err) return false;
      if (result.continuationToken) nextPage = result.continuationToken;
      result.entries.forEach((entry) => {
        readable.push({
          name: entry.name,
          etag: entry.etag,
          contentType: entry.contentLength,
          contentLength: entry.contentSettings.contentType,
          created_at: entry.creationTime,
        });
      });
    }
  );
  return readable;
}
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
export const download = async (filename, res: ServerResponse) => {
  const c = midiContainer.getBlobClient(filename);
  return readBuffer(await c.downloadToBuffer());
};

function readBuffer(buffer: Buffer) {
  let offset = 0;
  const dv = new DataView(buffer.buffer);
  const fgetc = () => dv.getUint8(offset++);
  const btoa = () => String.fromCharCode(dv.getUint8(offset++));
  const btoi = () =>
    (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const read16 = () => (fgetc() << 8) | fgetc();
  const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const fgets = (n: number) => {
    let s = "";
    while (n-- > 0) {
      s += String.fromCharCode(fgetc());
    }
    return s;
  };
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
  const headerLength = btoi();
  const format = read16();
  const ntracks = read16();
  const division = read16();
  output.push([chunkType, headerLength, format, ntracks, division].join(","));
  let lastHeader = "";

  while (offset < buffer.byteLength) {
    const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
    let mhrkLength = btoi();
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
      } else if (msg > 0x80) {
        if (!lastHeader) {
          output.push("#deltaTime, channel, action, additional ");
          lastHeader = "#deltaTime, channel, action, additional ";
        }
        const cmd = (0xf0 & msg) >> 4;

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
        const channel = msg & 0x0f;
        const additional = [fgetc(), fgetc()];
        output.push([deltaTime, channel, action, additional].join(","));
      }
    }
  }
}
