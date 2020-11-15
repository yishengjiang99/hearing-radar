import "../fifo.js";

function Fifo(size) {
	let ptr = _malloc(40);
	_fifo_init(ptr, size);
	return {
		getPtr: () => ptr,
		init: (ptr, size) => {
			_fifo_init(ptr, size);
		},
		write: (array) => {
			const inputPtr = _malloc(
				array.length * Uint8Array.BYTES_PER_ELEMENT
			);
			HEAPU8.set(array, inputPtr);
			_fifo_write(ptr, inputPtr, array.byteLength);
		},
		readFloat32: (length) => {
			const byteLength = length * Float32Array.BYTES_PER_ELEMENT;
			const ob = _malloc(byteLength);
			_fifo_read(ptr, ob, byteLength);
			return [new Float32Array(HEAPU8.buffer, ob, length), ob];
		},
		read: (length) => {
			const byteLength = length * Uint8Array.BYTES_PER_ELEMENT;
			const ob = _malloc(byteLength);
			_fifo_read(ptr, ob, byteLength);
			return [new Uint8Array(HEAPU8.buffer, ob, byteLength), ob];
		},
		available: () => {
			return _fifo_size(ptr);
		},
		free: (ptr) => {
			_free(ptr);
		},
	};
}

export default Fifo;
