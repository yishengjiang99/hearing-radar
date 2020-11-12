import { SharedRingBuffer } from "./shared-ring-buffer";
import { ReadWaveHeader } from "./xforms";
export const fetchsource = async (url: string) => {
	const highWaterMark = 1024 * 12;
	const srb: SharedRingBuffer = new SharedRingBuffer(1024 * 64);
	let ctxInfo = null,
		blockSize = 1024,
		first = true,
		readableStream: ReadableStream;

	const rs: ReadableStream = (await fetch(url)).body;
	const reader = rs.getReader({
		mode: "byob",
	});

	async function _pull(cb) {
		if (first && !ctxInfo) {
			const dv = new DataView(new ArrayBuffer(44));
			const { done, value } = await reader.read(dv);
			ctxInfo = ReadWaveHeader(dv);
			cb({ ctxInfo });
		} else {
			const ab = srb.prealloc(blockSize);
			const dv = new DataView(ab);
			const { done, value } = await reader.read(new DataView(ab));
			if (first && !ctxInfo) ctxInfo = ReadWaveHeader(dv);
			cb(done);
		}
		_pull(cb);
	}

	_pull(async function ({ meta, done }) {
		if (meta) {
			const { numberOfChannels, bitsPerSample, samplesPerSecond } = meta;
			srb.meta = { numberOfChannels, bitsPerSample, samplesPerSecond };
		}
		if (srb.availableFrames > highWaterMark) {
			srb.waitForDrain();
		}
	});

	return srb;
};
