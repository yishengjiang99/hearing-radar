import { FileSource, Oscillator } from "./audio-data-source";
import { SSRContext, CtxProps } from "./ssrctx";
import { MemoryWritable } from "grep-transform";
import { resolve } from "path";
import { PassThrough } from "stream";
import { expect } from "chai";
import { spawn } from "child_process";

// describe.skip("ssrctx", () => {
// 	it("sets framerate, bitdepths etc", (done) => {
// 		const ctx = new SSRContext({
// 			nChannels: 2,
// 			bitDepth: 16,
// 			fps: 9000 / 128,
// 			sampleRate: 9000,
// 		});
// 		expect(ctx.samplesPerFrame).to.equal(128 * 2);
// 		expect(ctx.blockSize).to.equal(
// 			ctx.samplesPerFrame * ctx.sampleArray.BYTES_PER_ELEMENT
// 		);
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
const sampleDir = (filename) => resolve(__dirname, "../samples", filename);

describe("users play music in browser at 32bit", () => {
	it("parse bitdepth from filename", () => {
		const ctx = SSRContext.fromFileName(sampleDir("song-f32le.pcm"));
		expect(ctx.bitDepth).to.equal(32);
		expect(ctx.sampleRate).to.equal(SSRContext.defaultProps.sampleRate);
	});
	it("writes sufficient amount of data for playback", (done) => {
		const ctx = new SSRContext({
			nChannels: 2,
			bitDepth: 32,
			sampleRate: 44100,
			fps: 44100 / 128,
		});
		const fss = new FileSource(ctx, {
			filePath: sampleDir("song-f32le.pcm"),
		});
		fss.connect(ctx);
		ctx.connect(
			spawn("ffplay", [
				"-f",
				"f32le",
				"-ac",
				"2",
				"-ar",
				"44100",
				"-i",
				"pipe:0",
			]).stdin
		);
		ctx.start();
		ctx.stop(1);
		ctx.on("end", done);
		// setTimeout(() => {
		// 	expect(ctx.frameNumber).greaterThan(200);
		// 	done();
		// }, 1000);
	});
});
