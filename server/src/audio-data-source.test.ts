import { expect } from "chai";
import { FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";

const sampleDir = (filename) =>
	require("path").resolve(__dirname, "../testdata", filename);

describe("fileSource", () => {
	it("reads from a file", (done) => {
		const ctx = new SSRContext({ nChannels: 1 });
		const file = new FileSource(ctx, {
			filePath: sampleDir("440.pcm"),
		});
		const d = file.pullFrame();
		expect(d).to.exist;
		expect(d.byteLength).to.equal(ctx.blockSize);
		ctx.stop(1);
		ctx.on("end", (d) => {
			expect(ctx.playing).be.false;
			done();
		});

		//	expect(buffer.byteLength).to.equal(ctx.blockSize);
	});
});
