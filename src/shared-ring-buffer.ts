export class SharedRingBuffer {
	pt: SharedArrayBuffer;
	state: Uint32Array;
	data: Float32Array;
	dataDecimal: Uint32Array;
	size: number;
	constructor(size: number) {
		this.pt = new SharedArrayBuffer(
			32 + 32 + size * Float32Array.BYTES_PER_ELEMENT
		);
		this.state = new Uint32Array(this.pt, 0, 2);
		this.data = new Float32Array(this.pt, 64);
		this.dataDecimal = new Uint32Array(this.pt, 64);
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
	}
	writeAB(vals: ArrayBuffer) {
		const view = new Uint32Array(vals);
		const len = view.byteLength / 4;
		const dv = new DataView(vals);
		const wptr = this.wptr;
		for (let i = 0; i < len; i++) {
			Atomics.store(
				this.dataDecimal,
				wptr + i,
				dv.getUint32(i * 4, true)
			);
		}
		this.wptr = wptr + len;
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
	get readable() {
		return new ReadableStream<Float32Array>({
			start: (controller) => {},
			pull: (controller) => {
				controller.enqueue(this.read());
			},
		});
	}
}
