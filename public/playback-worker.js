import Module from "./f32.wasmmodule.js";

let ws, procPort;

let sharedStream = false;
let buffered = 0;
const uint8ToFloat = (int1, int2) => {
	if (int2 & 0x80) {
		return -(0x10000 - ((int2 << 8) | int1)) / 0x8000;
	} else {
		return ((int2 << 8) | int1) / 0x7fff;
	}
};

const signed16ToFloat32 = () => {
	return new TransformStream({
		transform: (chunk, controller) => {
			for (let i = 0, j = 0; i < chunk.length - 1; i += 2) {
				chunk[j++] = uint8ToFloat(chunk[i], chunk[i + 1]);
			}
			controller.enqueue(chunk);
		},
	});
};
onmessage = async ({ data: { port, sampleUrl } }) => {
	let packageSkip = 0;
	let frames = 0;
	if (port) {
		procPort = port;
		postMessage({ init: 1 });
		port.onmessage = ({ data: { loss, done, rms, event } }) => {
			if (loss) {
				packageSkip++;
				postMessage({ rx1: "loss:" + packageSkip });
			}
			if (event) {
				postMessage({ event: "started" });
			}
		};
	}
	if (sampleUrl && procPort) {
		const { writable, readable } = new TransformStream();
		fetch(sampleUrl)
			.then((res) => {
				let xform = sampleUrl.includes("f32le")
					? new TransformStream({
							transform: (chunk, controller) => {
								controller.enqueue(new Uint32Array(chunk));
							},
					  })
					: signed16ToFloat32();
				res.body.pipeThrough(xform).pipeTo(writable);
			})
			.catch((err) => postMessage({ msg: "error:" + err.message }));
		procPort.postMessage({ readable }, [readable]);
	}
};
