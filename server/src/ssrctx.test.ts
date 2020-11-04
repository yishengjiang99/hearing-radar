import { Oscillator } from "./audio-data-source";
import { SSRContext, CtxProps } from "./ssrctx";
import { Writable } from "stream";
const expect = require("chai").expect;

describe("simple math", () => {
	it("2+2=4", () => {
		expect(2 + 2).to.equal(4);
	});
});

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
});
