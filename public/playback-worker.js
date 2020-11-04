let ws, procPort;
let sharedStream = false;
const signed16ToFloat32 = () => {
	const uint8ToFloat = (int1, int2) => {
		if (int2 & 0x80) {
			return -(0x10000 - ((int2 << 8) | int1)) / 0x8000;
		} else {
			return ((int2 << 8) | int1) / 0x7fff;
		}
	};
	return new TransformStream({
		transform: (chunk, controller) => {
			const fl = new Float32Array(chunk.byteLength / 2);
			for (let i = 0, j = 0; i < chunk.length - 1; i += 2) {
				fl[j++] = uint8ToFloat(chunk[i], chunk[i + 1]);
			}
			controller.enqueue(fl);
		},
	});
};
onmessage = async ({ data: { url, port, wsMsg, sampleUrl } }) => {
	if (url && port) {
		fetch(url, {
			cors: "cors",
		})
			.then((res) => res.text())
			.then((txt) => {
				postMessage(txt);
			});
		procPort = port;
	}
	if (sampleUrl && procPort) {
		const { writable, readable } = new TransformStream();
		fetch(sampleUrl)
			.then((res) =>
				res.body.pipeThrough(signed16ToFloat32()).pipeTo(writable)
			)
			.catch((err) => postMessage({ msg: "error:" + err.message }));
		procPort.postMessage({ readable }, [readable]);
	}
};
