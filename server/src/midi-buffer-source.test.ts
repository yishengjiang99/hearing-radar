import { initCache, loadBuffer, parseMidiCSV } from "./midi-buffer-source";
import { SSRContext } from "./ssrctx";

describe("midi-buffersource", () => {
	it("turns csv into pcm", async () => {
		const ctx = new SSRContext({
			nChannels: 1,
			bitDepth: 16,
			sampleRate: 9000,
		});
		const cache = initCache(ctx);
		await loadBuffer(
			ctx,
			parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"),
			cache
		);
		await loadBuffer(
			ctx,
			parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"),
			cache
		);
	});
});
