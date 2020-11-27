import { FileSource, Oscillator } from "./audio-data-source";
import { SSRContext, CtxProps, timediff } from "./ssrctx";
import { MemoryWritable } from "grep-transform";
import { resolve } from "path";
import { PassThrough } from "stream";
import { expect } from "chai";
import { spawn } from "child_process";

const sampleDir = (filename) => resolve(__dirname, "../samples", filename);

describe("ssrctx", () => {
  it("sets framerate, bitdepths etc", () => {
    const ctx = new SSRContext({
      nChannels: 2,
      bitDepth: 16,
      sampleRate: 9000,
    });
    expect(ctx.fps).to.equal(ctx.sampleRate / 128);
    expect(ctx.samplesPerFrame).to.equal(128 * 2);
    expect(ctx.blockSize).to.equal(
      ctx.samplesPerFrame * ctx.sampleArray.BYTES_PER_ELEMENT
    );
    expect(ctx.currentTime).to.equal(0);
    ctx.pump();
    expect(ctx.currentTime).to.equal(ctx.secondsPerFrame);
  });
  it("stops on time", (done) => {
    const ctx = new SSRContext({
      nChannels: 2,
      bitDepth: 16,
      sampleRate: 44100,
    });

    ctx.stop(0.1);
    ctx.start();
    setTimeout(() => {
      expect(ctx.playing).false;
      done();
    }, 122);

    // ctx.on("end", () => {
    // 	console.log(timediff(process.hrtime(), tick));
    // 	done();
    // });
    // setTimeout(() => {
    // 	expect(ctx.playing).false;
    // 	done();
    // }, 900);
  }).timeout(9000);
  it("parse bitdepth from filename", () => {
    const ctx = SSRContext.fromFileName(
      sampleDir("440-f32le-ac2-ar-44199.pcm")
    );
    expect(ctx.bitDepth).to.equal(32);
    expect(ctx.sampleRate).to.equal(SSRContext.defaultProps.sampleRate);
  });
  it("writes sufficient amount of data for playback", (done) => {
    const ctx = new SSRContext({
      nChannels: 2,
      bitDepth: 32,
      sampleRate: 44100,
    });
    const fss = new FileSource(ctx, {
      filePath: sampleDir("440-f32le-ac2-ar-44199.pcm"),
    });
    fss.connect(ctx);
    ctx.stop();
    done();
  });
});
// 		const osc = new Oscillator(ctx, { frequency: 440 });
// 		osc.connect(ctx);
// 		const writ = new MemoryWritable();
// 		ctx.connect(writ);
// 		ctx.start();
// 		setTimeout(() => {
// 			expect(writ.data.length).to.equal(9000 / 128);
// 			ctx.stop();

// 			done();
// 		}, 1000);
// 		// expect(ctx.blockSize).to.equal((2 * 4 * 9000) / 128);
// 	});
// 	it("writes signed int16", (done) => {
// 		const b = Buffer.allocUnsafe(32);
// 		b.writeInt16LE(255, 0);
// 		expect(b[0]).to.equal(1 * 0xff);
// 		done();
// 	});
// });
