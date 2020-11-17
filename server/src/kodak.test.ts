import { expect } from "chai";
import { FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";

describe("codec", () => {
	it("decode s16", () => {
		const ctx = SSRContext.fromFileName(
			"db/cache/s16le-ar9000-ac1-midi.csv.cache.pcm"
		);
		expect(ctx.bitDepth).eq(16);
		expect(ctx.nChannels).eq(1);

		const file = new FileSource(ctx, {
			filePath: "db/cache/s16le-ar9000-ac1-midi.csv.cache.pcm",
		});
		file.connect(ctx);
		const buff = file.pullFrame();
		console.log(buff);
	});
});
