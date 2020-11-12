export class SharedRingBuffer {
	pt: SharedArrayBuffer;
	state: Int32Array;
	data: Float32Array;
	dataDecimal: Uint32Array;
	size: number;
	audioCtxMeta: Int32Array;

	constructor(size: number) {
		this.pt = new SharedArrayBuffer(
			Uint32Array.BYTES_PER_ELEMENT * 2 +
				Uint32Array.BYTES_PER_ELEMENT * 2 +
				size * Float32Array.BYTES_PER_ELEMENT
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
			samplesPerSecond,
			bitsPerSample: info & 0x7fff,
			numberOfChannels: info & 0x8000,
		};
	}
	set meta({ numberOfChannels, bitsPerSample, samplesPerSecond }) {
		Atomics.store(this.audioCtxMeta, 0, samplesPerSecond);
		Atomics.store(
			this.audioCtxMeta,
			1,
			(numberOfChannels << 7) | bitsPerSample
		);
	}
	readAUblock(destination: any) {
		const dest = destination || new Float32Array(this.blockSize / 4);
		this.readToArray(dest);
		return dest;
	}
	waitForDrain() {
		return Atomics.wait(this.state, 1, this.rptr);
	}

	prealloc(length: number) {
		return this.data.subarray(this.wptr, (this.wptr += length));
	}
	writeAB(vals: ArrayBuffer) {
		this.data.set(new Float32Array(vals), this.wptr);
		this.wptr += vals.byteLength / 4;
	}
	read() {
		if (this.wptr > this.rptr) {
			const ret = this.data.slice(this.rptr, this.wptr);
			this.rptr = this.wptr;
			return ret;
		} else if (this.wptr < this.rptr) {
			const output = new Float32Array(this.size - this.rptr + this.wptr);
			output.set(this.data.slice(this.rptr, this.size), 0);
			output.set(
				this.data.slice(0, this.wptr),
				this.size - this.rptr - 1
			);
			return output;
		}
	}
	readToArray(arr: ArrayBuffer) {
		const start = this.rptr;
		const len = arr.byteLength / Float32Array.BYTES_PER_ELEMENT;

		const dv = new DataView(this.data.buffer);
		for (let i = 0; i < len; i++) {
			arr[i] = dv.getFloat32(
				(start + i) * Float32Array.BYTES_PER_ELEMENT,
				true
			);
		}
		this.rptr += len;
	}
	get blockSize() {
		const { numberOfChannels, bitsPerSample, samplesPerSecond } = this.meta;
		return (128 * numberOfChannels * bitsPerSample) / 4;
	}
	get writableAB() {
		return new WritableStream<ArrayBuffer>({
			write: (chunk: ArrayBuffer) => {
				this.writeAB(chunk);
			},
		});
	}
	get writable() {
		return new WritableStream<Float32Array>({
			write: (chunk: Float32Array) => {
				this.data.set(chunk, this.wptr);
				this.wptr = this.wptr + chunk.length;
			},
		});
	}
	// get readable() {
	// 	return new ReadableStream<Float32Array>({
	// 		start: (controller) => {,
	// 		pull: (controller) => {
	// 			const block = this.prealloc(this.blockSize);
	// 			this.readToArray(block);
	// 			controller.enqueue(block);
	// 		},
	// 	});
	// }
}
