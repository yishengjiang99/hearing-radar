import { fetchsource } from "./pull";
import { SharedRingBuffer } from "./shared-ring-buffer";

describe("pull fetch", () => {
	it("fetch url then pull readablestream", () => {
		const sharedRingBuffer: SharedRingBuffer = new SharedRingBuffer(
			1024 * 1024
		);
		fetchsource(
			"http://localhost:3000/samples/elise.wav",
			sharedRingBuffer
		).then((sbr) => {
			while (sbr.availableFrames > 128 * 1000) {
				const ctx = new AudioContext({
					sampleRate: sbr.meta.sampleRate,
					latencyHint: "playback",
				});
				const bb = new ArrayBuffer(128 * 1000);
				sbr.read(bb);
				const int16s = new Int16Array(bb);
				const ausrc = new AudioBuffer({
					numberOfChannels: 2,
					sampleRate: ctx.sampleRate,
					length: 128 * 2,
				});
				const [ch1, ch2] = [
					ausrc.getChannelData(0),
					ausrc.getChannelData(1),
				];
				for (let j = 0, i = 0; i < int16s.length; i += 4) {
					const d1 = int16s[i] | (int16s[i + 1] << 8);
					const d2 = int16s[i + 2] | (int16s[i + 3] << 8);
					ch1[j] =
						int16s[i + 1] & 80
							? 0x10000 - d1 / 0x8000
							: d1 / 0x7fff;
					ch2[j++] =
						int16s[i + 3] & 80
							? 0x10000 - d2 / 0x8000
							: d2 / 0x7fff;
				}
				const src = new AudioBufferSourceNode(ctx, { buffer: ausrc });
				src.connect(ctx.destination);
				src.start();
			}
		});
	});
});
