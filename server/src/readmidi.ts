import { readFileSync } from "fs";

const buffer = readFileSync("song.mid");
let offset = 0;
const dv = new DataView(buffer.buffer);
const fgetc = () => dv.getUint8(offset++);
const btoa = () => String.fromCharCode(dv.getUint8(offset++));
const btoi = () => (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
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

const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
const headerLength = btoi();
const format = read16();
const ntracks = read16();
const division = read16();
console.log({
  chunkType,
  headerLength,
  format,
  ntracks,
  division,
});
let lastHeader = "";

while (offset < buffer.byteLength) {
  const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
  let mhrkLength = btoi();
  console.log("#section ", mhrk, mhrkLength);
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
      console.log(
        deltaTime,
        cmd,
        info.map((t) => JSON.stringify(t))
      );
    } else if (msg > 0x80) {
      if (!lastHeader) {
        console.log("#deltaTime, channel, action, additional ");
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
      console.log([deltaTime, channel, action, additional].join(","));
    }
  }
}
