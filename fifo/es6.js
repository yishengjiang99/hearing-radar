export const FifoPtr = function (ptr) {
	return {
		ptr,
		write: (array) => {
			const inputPtr = _malloc(
				array.length * Uint8Array.BYTES_PER_ELEMENT
			);
			HEAPU8.set(array, inputPtr);
			_fifo_write(ptr, inputPtr, array.byteLength);
		},
		raedFloat32: (length) => {
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
};
export const Fifo = function (size) {
	const ptr = _malloc(32);
	_fifo_init(ptr, size);
	return FifoPtr(ptr);
};
