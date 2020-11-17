import { SharedRingBuffer } from "./shared-ring-buffer";
import { ReadWaveHeader } from "./xforms";
export const fetchsource = async (
	url: string,
	srb: SharedRingBuffer
): Promise<SharedRingBuffer> => {
	const highWaterMark = 1024 * 12;
	const rs: ReadableStream = (await fetch(url)).body;
	const reader = rs.getReader();
	let first = true;
	let abort = false;
	reader.read().then(function process({ done, value }) {
		if (done || abort) return;
		let ab: ArrayBuffer = value.buffer;
		if (first) {
			srb.meta = ReadWaveHeader(new DataView(ab));
			first = false;
			ab = ab.slice(48);
		}
		srb.write(value.buffer);
		if (srb.availableFrames > highWaterMark) {
			srb.waitForDrain();
		}
		reader.read().then(process);
	});
	return srb;
};
