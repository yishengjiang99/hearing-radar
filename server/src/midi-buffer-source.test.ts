import { expect } from "chai";
import { createWriteStream } from "fs";
import { BufferSource } from "./audio-data-source";
import { execSync } from "child_process";
import { loadBuffer, parseMidiCSV, playCSVmidi } from "./midi-buffer-source";
import { SSRContext } from "./ssrctx";
import { PassThrough } from "stream";
import { resolve } from "path";
import { CacheStore } from "./flat-cache-store";
const tickToTime = (t) => t / 1000;
describe("plays midi", () => {
  it("s", () => {
    // const filename = "../Beethoven-Symphony5-1.mid";
    // const ctx = SSRContext.fromFileName("-ac1-s16le");
    // playCSVmidi(write)
  });
});
describe("midi-buffersource", () => {
  let ctx, noteCache;
  beforeEach(() => {
    ctx = new SSRContext({
      nChannels: 1,
      bitDepth: 16,
      sampleRate: 9000,
    });
    noteCache = new CacheStore(
      33,
      ctx.bytesPerSecond * 2,
      resolve(`db/cache/test`)
    );
  });

  it("it loads buffer from file", async () => {
    const buffer = await loadBuffer(
      ctx,
      parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"),
      null
    );
    const buffer2 = await loadBuffer(
      ctx,
      parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"),
      noteCache
    );
    expect(noteCache.length).to.equal(1);

    ctx.stop(0);
  });
  it("makes BufferSource", async () => {
    const cache = noteCache;

    const note = parseMidiCSV("clarinet,67,,,0,116");
    await loadBuffer(ctx, note, cache);
    const brs = new BufferSource(ctx, {
      start: tickToTime(note.start),
      end: tickToTime(note.start + note.duration),
      getBuffer: () => cache.read(`${note.instrument}${note.midi}`),
    });
    let offset = 0;
    const buffer = brs.pullFrame();
    buffer.readInt16LE(offset);
    while (offset < ctx.blockSize) {
      const n = buffer.readInt16LE(offset);
      offset += 2;
    }
  });
  it("add as a track to ssr context", (done) => {
    let line = `clarinet,67,0.14150849999999998,,0,116`;

    const note = parseMidiCSV(line);

    const cache = noteCache;

    loadBuffer(ctx, note, cache).then((buffer) => {
      new BufferSource(ctx, {
        start: tickToTime(note.start),
        end: tickToTime(note.start + note.duration),
        buffer: buffer,
      });
      const output = createWriteStream("outputfile.wav");
      output.write(new Uint8Array(ctx.WAVHeader));

      ctx.connect(output);
      ctx.start();
      setTimeout(() => {
        // execSync("ffplay -i outputfile.wav");
        ctx.stop(0);
        done();
      }, 400);
    });
  }).timeout(2000);
});
// describe("test", () => {
//   it("test", () => {
//     async function test() {
//       const ctx = new SSRContext({
//         nChannels: 2,
//         bitDepth: 16,
//         sampleRate: 44100,
//       });
//       const cache = initCache(ctx);

//       const note = parseMidiCSV("clarinet,67,,,0,116");
//       await loadBuffer(ctx, note, cache);
//       console.log(note.start);
//       const brs = new BufferSource(ctx, {
//         start: tickToTime(note.start),
//         end: tickToTime(note.start + note.duration),
//         getBuffer: () => cache.read(`${note.instrument}${note.note}`),
//       });
//       console.log(brs._start);
//       brs.connect(ctx);
//       const pt = new PassThrough();

//       const wt = createWriteStream("t1.wav");
//       ctx.connect(wt);
//       ctx.start();
//       pt.on("data", (d) => {
//         let offset = 0;
//         while (offset * 2 < d.byteLength - 2) {
//           const n = d.readInt16LE(offset);
//           offset++;
//           process.stdout.write(n + "\n");
//         }
//       });
//       // while (offset * 2 < buffer.byteLength - 2) {
//       // 	const n = buffer.readInt16LE(offset);
//       // 	offset++;
//       // 	process.stdout.write(n + ",");
//       // }
//     }
//     // test();
//   });
// });
