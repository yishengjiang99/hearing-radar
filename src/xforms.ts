export const ABTransform: () => TransformStream<
	Uint8Array,
	Float32Array
> = () => {
	let first = true;
	let headerInfo;
	return new TransformStream<Uint8Array, Float32Array>({
		transform: (chunk, controller) => {
			const view = new DataView(chunk.buffer);
			let i = 0;
			if (first) {
				headerInfo = ReadWaveHeader(view);
			}
			if (headerInfo.bitsPerSample === 16) {
				const op = new Float32Array(chunk.byteLength / 2);
				for (let i = 0; i < op.length; i++) {
					const data = view.getInt16(i * 2, true);
					op[i] = data < 0 ? data / 32768 : data / 32767;
				}
				controller.enqueue(op);
			} else {
				const op = new Float32Array(chunk.byteLength / 4);
				for (let i = 0; i < op.length; i++) {
					op[i] = view.getFloat32(i * 4, true);
				}
				controller.enqueue(op);
			}
		},
	});
};

export const ReadWaveHeader = (view: DataView) => {
	const [
		numberOfChannels,
		samplesPerSecond,
		bytesPerSecond,
		bytesPerSample,
		bitsPerSample,
	] = [
		view.getUint16(22, true),
		view.getUint32(24, true),
		view.getUint32(28, true),
		view.getUint32(32, true),
		view.getUint16(34, true),
	];
	const headerInfo = {
		numberOfChannels,
		samplesPerSecond,
		bytesPerSecond,
		bytesPerSample,
		bitsPerSample,
	};
	return headerInfo;
};
