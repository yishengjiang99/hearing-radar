// import { SharedRingBuffer } from "./shared-ring-buffer";
// let postMessage = self.postMessage;
// let ws, procPort;

// let sharedStream = false;
// let buffered = 0;
// onmessage = async ({ data: { port, sampleUrl } }) => {
// 	let packageSkip = 0;
// 	let frames = 0;
// 	if (port) {
// 		procPort = port;
// 		postMessage({ init: 1 });
// 		port.onmessage = ({ data }) => postMessage(data);
// 	}
// 	if (sampleUrl && procPort) {
// 		//const sbs = new SharedRingBuffer(1024 * 16);
// 		postMessage({ event: "fetch " + sampleUrl });
// 		const sbs = new SharedRingBuffer(1024 * 16);
// 		const { writable, readable } = new TransformStream();
// 		const res = await fetch(sampleUrl);
// 		const reader = res.body.getReader();
// 		reader.read().then(function process({ value, done }) {
// 			if (done) return;
// 			sbs.writeAB(value.buffer);
// 			reader.read().then(process);
// 		});
// 		// res.body.pipeThrough(readFloat32()).pipeTo(sbs.writable);
// 		// procPort.postMessage({ readable }, [readable]);
// 		// setInterval(()=>{
// 		// 	postMessage({pstats:{sbs.wptr}})
// 		// },500)
// 	}
// };

// const readFloat32 = () => {
// 	let first = true;
// 	let headerInfo;
// 	return new TransformStream({
// 		transform: (chunk, controller) => {
// 			const view = new DataView(chunk.buffer);
// 			let i = 0;
// 			if (first) {
// 				const [
// 					numberOfChannels,
// 					samplesPerSecond,
// 					bytesPerSecond,
// 					bytesPerSample,
// 					bitsPerSample,
// 				] = [
// 					view.getUint16(22, true),
// 					view.getUint32(24, true),
// 					view.getUint32(28, true),
// 					view.getUint32(32, true),
// 					view.getUint16(34, true),
// 				];
// 				headerInfo = {
// 					numberOfChannels,
// 					samplesPerSecond,
// 					bytesPerSecond,
// 					bytesPerSample,
// 					bitsPerSample,
// 				};
// 				first = false;
// 				postMessage({ msg: JSON.stringify(headerInfo) });
// 				console.log(headerInfo);
// 			}
// 			if (headerInfo.bitsPerSample === 16) {
// 				const op = new Float32Array(chunk.byteLength / 2);
// 				for (let i = 0; i < op.length; i++) {
// 					const data = view.getInt16(i * 2, true);
// 					op[i] = data < 0 ? data / 32768 : data / 32767;
// 				}
// 				controller.enqueue(op);
// 			} else {
// 				const op = new Float32Array(chunk.byteLength / 4);
// 				for (let i = 0; i < op.length; i++) {
// 					op[i] = view.getFloat32(i * 4, true);
// 				}
// 				controller.enqueue(op);
// 			}
// 		},
// 	});
// };
