import { FileSource, Oscillator } from "./audio-data-source";
import { SSRContext, CtxProps } from "./ssrctx";
import { Writable } from "stream";
import { spawn } from "child_process";
import { doesNotMatch } from "assert";
const expect = require("chai").expect;

describe("ssrctx", () => {
	it("sets framerate, bitdepths etc", (done) => {
		const ctx = new SSRContext({
			nChannels: 2,
			bitDepth: 16,
			fps: 9000 / 128,
			sampleRate: 9000,
		});
		expect(ctx.samplesPerFrame).to.equal(128 * 2);
		expect(ctx.blockSize).to.equal(
			ctx.samplesPerFrame * ctx.sampleArray.BYTES_PER_ELEMENT
		);
		const osc = new Oscillator(ctx, { frequency: 440 });
		osc.connect(ctx);
		const wt = new Writable({
			write: (
				chunk: any,
				encoding: BufferEncoding,
				cb: (e: Error) => void
			) => {
				expect(encoding).to.equal("buffer");
				expect(chunk.byteLength).to.equal(ctx.blockSize);
				ctx.stop();
				done();
				return;
				cb(null);
			},
		});
		ctx.connect(wt);
		ctx.start();
		setTimeout(() => {
			ctx.stop();
		}, 1000);

		// expect(ctx.blockSize).to.equal((2 * 4 * 9000) / 128);
	});
	it("writes signed int16", (done) => {
		const b = Buffer.allocUnsafe(32);
		b.writeInt16LE(255, 0);
		expect(b[0]).to.equal(1 * 0xff);
		done();
	});
	it("writes sufficient amount of data for playback", (done) => {
		const ctx = new SSRContext({
			nChannels: 2,
			bitDepth: 32,
			sampleRate: 44100,
			fps: 1 / 44100,
		});
		const fss = new FileSource(ctx, {
			filePath: "./byebyebye.pcm",
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
		setTimeout(() => {
			expect(ctx.frameNumber).greaterThan(200);
			done();
		}, 1000);
	});
});
