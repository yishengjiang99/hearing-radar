import { assert } from "chai";

export class SharedRingBuffer {
	pt: SharedArrayBuffer;
	state: Int32Array;
	data: Float32Array;
	dataDecimal: Uint32Array;
	size: number;
	audioCtxMeta: Int32Array;

	constructor(size: number) {
		assert(size % 128 == 0, "size must be multiples of 128");
		const metasize = Int32Array.BYTES_PER_ELEMENT * 4;

		this.pt = new SharedArrayBuffer(
			metasize + size * Float32Array.BYTES_PER_ELEMENT
		);
		this.state = new Int32Array(this.pt, 0, 2);
		this.audioCtxMeta = new Int32Array(
			this.pt,
			Int32Array.BYTES_PER_ELEMENT * 2,
			2
		);

		this.data = new Float32Array(
			this.pt,
			Int32Array.BYTES_PER_ELEMENT * 2 + Int32Array.BYTES_PER_ELEMENT * 2
		);
		this.dataDecimal = new Uint32Array(
			this.pt,
			Int32Array.BYTES_PER_ELEMENT * 2 + Int32Array.BYTES_PER_ELEMENT * 2
		);
		this.size = size;
	}
	get wptr() {
		return Atomics.load(this.state, 0);
	}
	get rptr() {
		return Atomics.load(this.state, 1);
	}
	set wptr(val: number) {
		Atomics.store(this.state, 0, val % this.size);
	}
	set rptr(val: number) {
		Atomics.store(this.state, 1, val % this.size);
		Atomics.notify(this.state, 1, 1);
	}
	get availableFrames() {
		return this.wptr - this.rptr;
	}
	get meta() {
		const [samplesPerSecond, info] = [
			Atomics.load(this.audioCtxMeta, 0),
			Atomics.load(this.audioCtxMeta, 1),
		];
		return {
			sampleRate: samplesPerSecond,
			bitsPerSample: info & 0x7fff,
			numberOfChannels: info & 0x8000,
		};
	}
	set meta({ numberOfChannels, bitsPerSample, sampleRate }) {
		Atomics.store(this.audioCtxMeta, 0, sampleRate);
		Atomics.store(
			this.audioCtxMeta,
			1,
			(numberOfChannels << 7) | bitsPerSample
		);
	}

	waitForDrain() {
		return Atomics.wait(this.state, 1, this.rptr);
	}

	prealloc(length: number) {
		return this.data.subarray(this.wptr, (this.wptr += length));
	}
	write(vals: ArrayBuffer) {
		const wptr = this.wptr;
		for (let i = 0; i < vals.byteLength; i++) {
			this.pt[wptr + i] = vals[0];
		}
		this.wptr += vals.byteLength;
	}
	read(vals: ArrayBuffer = new ArrayBuffer(128 * 4)) {
		const rpt = this.rptr;
		if (this.availableFrames < vals.byteLength) return false;
		for (let i = 0; i < vals.byteLength; i++) {
			vals[i] = this.pt[(rpt + i) & this.pt.byteLength];
		}
	}
	readAuBlock(channelData: Float32Array[]) {
		if (this.meta.numberOfChannels == 1 && channelData.length == 1) {
			const dv = new DataView(this.dataDecimal);
		}
	}
	get blockSize() {
		const { numberOfChannels, bitsPerSample } = this.meta;
		return (128 * numberOfChannels * bitsPerSample) / 4;
	}
}
