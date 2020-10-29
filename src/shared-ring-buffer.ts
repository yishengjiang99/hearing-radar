/*
  typedef struct{
    uint8_t rPtr;
    uint8_t wPtr;
    uint16_t data[];
  }SharedRingBuffer
*/
export default class SharedRingBuffer {
	dataBuffer: Float32Array;
	stateBuffer: Uint16Array;
	bufferSize: number;

	constructor(sharedBuffer: SharedArrayBuffer) {
		this.stateBuffer = new Uint16Array(
			sharedBuffer,
			0,
			Uint16Array.BYTES_PER_ELEMENT * 2
		);

		this.dataBuffer = new Float32Array(
			sharedBuffer,
			Uint16Array.BYTES_PER_ELEMENT * 2
		);
		this.bufferSize = sharedBuffer.byteLength - 4;
	}

	write(data: Float32Array) {
		let wptr = this.wPtr;
		for (let i = 0; i < data.length; i++) {
			this.dataBuffer[wptr++] = data[i];
		}
		this.wPtr = wptr;
	}

	read(n: number) {
		const ptr = this.readPtr;

		if (this.readPtr + n < this.bufferSize) {
			this.readPtr += n;
			return this.dataBuffer.subarray(ptr, ptr + n);
		} else {
			this.readPtr = 0;
			return this.dataBuffer.subarray(ptr, this.bufferSize);
		}
	}

	get wPtr() {
		return Atomics.load(this.stateBuffer, 0);
	}
	set wPtr(value: number) {
		Atomics.store(this.stateBuffer, 0, value % this.bufferSize);
	}
	get readPtr() {
		return Atomics.load(this.stateBuffer, 1);
	}
	set readPtr(value: number) {
		Atomics.store(this.stateBuffer, 1, value % this.bufferSize);
	}
}
