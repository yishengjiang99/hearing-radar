import { expect } from "chai";
import { spawn } from "child_process";
import { openSync, readSync, closeSync } from "fs";
import { BufferSource, FileSource, Oscillator } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
describe("filesource", () => {
  it("plays from a file", (done) => {
    const ctx = SSRContext.fromFileName(
      "./samples/billie-ac2-ar-44100-s16le.pcm"
    );
    const file = new FileSource(ctx, {
      filePath: "./samples/billie-ac2-ar-44100-s16le.pcm",
    });
    file.connect(ctx);
    const play = spawn(
      "ffplay",
      "-t 30 -i pipe:0 -ac 2 -ar 44100 -f s16le".split(" ")
    ).stdin;
    ctx.on("data", (d) => {
      play.write(d);
    });
    ctx.start();
    setTimeout(() => {
      expect(1);
      done();
    }, 30000);
  }).timeout(40000);
});

describe("oscilator", () => {
  it("ssr must generate correct audio at 16bit signal", () => {
    const ctx = new SSRContext({
      bitDepth: 16,
      sampleRate: 9000,
      nChannels: 1,
    });
    const osc = new Oscillator(ctx, { frequency: 440 });
    osc.start();
    const buffer = osc.pullFrame();
    expect(buffer.length).to.equal(ctx.blockSize);
    expect(buffer.byteLength).to.equal(128 * 2);
    ctx.start();
    ctx.stop(0.5);
  });
});
const sampleDir = (filename) =>
  require("path").resolve(__dirname, "../samples", filename);

// describe("fileSource", () => {
//   it("reads from a file", (done) => {
//     const ctx = new SSRContext({ nChannels: 1 });
//     const file = new FileSource(ctx, {
//       filePath: sampleDir("440.pcm"),
//     });
//     const d = file.pullFrame();
//     expect(d).to.exist;
//     expect(d.byteLength).to.equal(ctx.blockSize);
//     const readFile = readFileSync(sampleDir("440.pcm"));
//     const buff = readFile.slice(0, ctx.blockSize);
//     expect(buff).deep.equal(d);
//     ctx.stop();
//     done();
//     //	expect(buffer.byteLength).to.equal(ctx.blockSize);
//   });
//   it("delivers over server", (done) => {
//     const ctx = SSRContext.fromFileName(
//       "./samples/billie-ac2-ar-44100-s16le.pcm"
//     );
//     const file = new FileSource(ctx, {
//       filePath: "./samples/billie-ac2-ar-44100-s16le.pcm",
//     });
//     file.connect(ctx);
//     const play = spawn(
//       "ffplay",
//       "-i pipe:0 -ac 2 -ar 44100 -f s16le".split(" ")
//     ).stdin;
//     ctx.on("data", (d) => {
//       play.write(d);
//     }); //(play); //spawn('ffplay',`-i pipe:0 -ac 2 -ar 4410 -f s16le`.split(' '))))
//     ctx.start();
//     file.on("end", done);
//   });
// });

describe("playaudio", () => {
  it("ssr must generate correct audio at 16bit signal", () => {
    const ctx = new SSRContext({
      bitDepth: 16,
      sampleRate: 9000,
      nChannels: 1,
    });
    const osc = new Oscillator(ctx, { frequency: 440 });
    osc.start();
    const buffer = osc.pullFrame();
    expect(buffer.length).to.equal(ctx.blockSize);
    expect(buffer.byteLength).to.equal(128 * 2);
    ctx.start();
    ctx.stop(0.5);
  });
});
describe("scheduled buffere source", () => {
  const ctx = new SSRContext();
  const fd = openSync(sampleDir("440.pcm"), "r");
  const buffer = Buffer.allocUnsafe(ctx.blockSize * 350);
  readSync(fd, buffer, 0, ctx.blockSize * 350, 0);
  closeSync(fd);
  it("should play about 1 second", (done) => {
    const node = new BufferSource(ctx, {
      buffer: buffer,
      start: 0.12,
      end: 0.31,
    });
    node.connect(ctx);
    expect(ctx.inputs.length).to.equal(1);
    expect(node.active).false;
    setTimeout(() => {
      expect(node.active).true;
      setTimeout(() => {
        expect(node.active).false;
        done();
      }, 330);
    }, 200);
    ctx.start();
  });
  afterEach(() => {
    ctx.stop(0);
  });
});
