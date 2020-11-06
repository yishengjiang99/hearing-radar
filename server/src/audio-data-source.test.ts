import { expect } from "chai";
import { FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
describe("fileSource", () => {
	it("reads from a file", (done) => {
		const ctx = new SSRContext({ nChannels: 1 });

		const file = new FileSource(ctx, {
			filePath: "./bil.mp3",
		});

		const d = file.pullFrame();
		expect(d).to.exist;
		expect(d.byteLength).to.equal(ctx.blockSize);
		done();

		//	expect(buffer.byteLength).to.equal(ctx.blockSize);
	});
});
