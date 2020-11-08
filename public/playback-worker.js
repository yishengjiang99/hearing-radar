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
	console.log(sampleUrl);
	let packageSkip = 0;
	let frames = 0;
	if (port) {
		procPort = port;
		postMessage({ init: 1 });
		port.onmessage = ({ data: { loss, done, stats, event, msg } }) => {
			console.log({ loss, done, stats, event, msg });
			if (loss) {
				packageSkip++;
				postMessage({ rx1: "loss:" + packageSkip });
			}
			if (event) {
				postMessage({ event: "started" });
			}
			if (msg) {
				postMessage({ msg });
			}
			if (stats) postMessage({ stats });
		};
	}
	if (sampleUrl && procPort) {
		postMessage({ event: "fetch " + sampleUrl });
		const { writable, readable } = new TransformStream();
		fetch(sampleUrl)
			.then((res) => {
				let xform;
				if (sampleUrl.includes("f32le")) {
					postMessage({ msg: "parsing f32le" });
					xform = new TransformStream({
						transform: (chunk, controller) => {
							function U32toF32(i) {
								if (i === 0) return 0;
								let r = i & ((1 << 23) - 1);
								r /= 1 << 23;
								r += 1.0;
								const bias = 127;
								let shift = ((i >> 23) & 0xff) - bias;
								for (; shift > 0; shift--) r *= 2;
								for (; shift < 0; shift++) r /= 2;

								return r;
							}
							let u32 = new Uint32Array(chunk);
							let f32 = new Float32Array(chunk.length);
							for (let i = 0; i < chunk.length; i++) {
								f32[i] = U32toF32(chunk[i]);
							}
							controller.enqueue(f32);
						},
					});
				} else {
					xform = signed16ToFloat32();
				}
				res.body.pipeThrough(xform).pipeTo(writable);
			})
			.catch((err) => postMessage({ msg: "error:" + err.message }));

		procPort.postMessage({ readable }, [readable]);
	}
};
