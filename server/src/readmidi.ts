import { readFileSync } from "fs";
import { emit } from "process";
import { Readable, Transform } from "stream";
import {SharedRingBuffer,getReader}from'./shared-ring-buffer';

class MIDIBufferTransform extends Transform{
	reader:any;
	sbr: SharedRingBuffer;
	constructor(){
		super();
		this.sbr=new SharedRingBuffer(1024);
		this.reader = getReader(this.sbr);
	}
}

function* readMidi() {
  const { btoa, read32, read16, readVarLength, fgets, fgetc } = this.reader();
  const dv = new DataView(buffer.buffer);
  const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
  const headerLength = read32();
  const format = read16();
  const ntracks = read16();
  const division = read16();
  yield {
    type: "header",
    title: chunkType,
    headerLength,
    format,
    ntracks,
    division,
  };

  for(let i =0; i<ntracks; i++){

  }
}

export function bufferGetMIDI(readable: Readable) {
  const {
    fgetc,
    btoa,
    read32,
    read24,
    read16,
    fgets,
	readVarLength,
	readDone
  } = getReader(buffer);

  const dv = new DataView(buffer.buffer);
  const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
  const headerLength = read32();
  const format = read16();
  const ntracks = read16();
  const division = read16();

  for(let i =0; i<ntracks; i++){
	const mhrk = [btoa(), btoa(), btoa(), btoa()].join("");
    let mhrkLength = read32();
    console.log("#section ", mhrk, mhrkLength);
    const endOfChunk = this.sbr.r + mhrkLength;
    for()
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
  while(readDone()
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
}
const buffer = readFileSync("song.mid");

export class MidiTransform extends Transform {}
