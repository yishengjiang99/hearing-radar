import { expect } from "chai";
import { spawn } from "child_process";
import { closeSync, openSync, readFileSync, readSync } from "fs";
import { wscat } from "grep-wss";
import { BufferSource, FileSource, Oscillator } from "./audio-data-source";
import { SSRContext } from "./ssrctx";

const sampleDir = (filename) => require("path").resolve(__dirname, "../testdata", filename);

describe("fileSource", () => {
  it("reads from a file", (done) => {
    const ctx = new SSRContext({ nChannels: 1 });
    const file = new FileSource(ctx, {
      filePath: sampleDir("440.pcm"),
    });
    const d = file.pullFrame();
    expect(d).to.exist;
    expect(d.byteLength).to.equal(ctx.blockSize);
    const readFile = readFileSync(sampleDir("440.pcm"));
    const buff = readFile.slice(0, ctx.blockSize);
    expect(buff).deep.equal(d);
    ctx.stop();
    done();
    //	expect(buffer.byteLength).to.equal(ctx.blockSize);
  });
});

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
    expect(ctx.inputs.length).to.equal(1);
    expect(node.active).false;
    setTimeout(() => {
      expect(node.active).true;
      setTimeout(() => {
        expect(node.active).false;
        done();
      }, 330);
    }, 123);
    ctx.start();
  });
  afterEach(() => {
    ctx.stop(0);
  });
});
