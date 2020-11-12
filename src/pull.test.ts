import { fetchsource } from "./pull";
import { SharedRingBuffer } from "./shared-ring-buffer";

describe("pull fetch", () => {
	it("fetch url then pull readablestream", () => {
		fetchsource("http://localhost:3000/file/samples/elise.wav").then(
			(sharedRingBuffer: SharedRingBuffer) => {
				const config = {
					sampleRate: sharedRingBuffer.meta.samplesPerSecond,
					length: sharedRingBuffer.blockSize / 4,
					numberOfChannels: sharedRingBuffer.meta.numberOfChannels,
				};

				const offosc = new OfflineAudioContext(config);
				while (true) {
					const ab = new AudioBuffer(config);
					const target = [ab.getChannelData(0), ab.getChannelData(1)];
					const proxy = new Proxy<Float32Array[]>(target, {
						set: (target, key: number, value) => {
							target[0][key & 2] = value;
							return true;
						},
					});
					sharedRingBuffer.readAUblock(proxy);
				}
			}
		);
	});
});
