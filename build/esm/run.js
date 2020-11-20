import { __awaiter } from "tslib";
export function initJustUpload(ctx, inputNode, onEvents) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ctx.audioWorklet.addModule("upload-processor.js?t=" + new Date().getMilliseconds());
        const uploadProcessor = new AudioWorkletNode(ctx, "upload-processor");
        onEvents("upload proc loaded");
        const worker = new Worker("upload-worker.js?t=" + new Date().getMilliseconds(), { type: "module" });
        worker.postMessage({ port: uploadProcessor.port }, [uploadProcessor.port]);
        worker.onmessage = ({ data }) => {
            data.msg && onEvents(data.msg);
            data.rx1 && onEvents(data.rx1);
        };
        inputNode.disconnect();
        inputNode.connect(uploadProcessor);
        uploadProcessor.connect(ctx.destination);
        return { worker, uploadProcessor };
    });
}
export function initUploader(ctx, stdout, rx1) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield ctx.audioWorklet.addModule("upload-processor.js?t=" + new Date().getMilliseconds());
            const uploadProcessor = new AudioWorkletNode(ctx, "upload-processor");
            stdout("upload proc loaded");
            const worker = new Worker("upload-worker.js?t=" + new Date().getMilliseconds(), { type: "module" });
            worker.postMessage({ port: uploadProcessor.port }, [uploadProcessor.port]);
            worker.onmessage = ({ data }) => {
                data.msg && stdout(data.msg);
                data.rx1 && rx1(data.rx1);
            };
            const micStream = yield navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const source = ctx.createMediaStreamSource(micStream);
            source.connect(uploadProcessor);
            const postGain = new GainNode(ctx, { gain: 0.01 });
            uploadProcessor.connect(postGain);
            const analyzer = new AnalyserNode(ctx, { fftSize: 1024 });
            postGain.connect(analyzer);
            analyzer.connect(ctx.destination);
            return {
                uploadProcessor,
                worker,
                source,
                postGain,
                analyzer,
            };
        }
        catch (e) {
            alert(e.message);
        }
    });
}
// }
// // export const readReader = async (rs: ReadableStream) => {
// // 	rs.getReader({ mode: "byob" }).read(new Uint8Array(1024))
// // };
// export const msgEventReader = async (port: MessagePort) => {
// 	const ws = new WebSocket("ws://localhost:5150");
// 	await new Promise((resolve, reject) => {
// 		ws.onopen = () => {
// 			const { readable, writable } = new TransformStream();
// 			// port.postMessage({ readable }, [readable]);
// 			ws.onmessage = (event) => {
// 				const b: Blob = event.data;
// 				// new Response(b).body.pipeTo(writable) .stream().getReader().pipeTo(writable);
// 			};
// 			resolve();
// 		};
// 	});
// };
//# sourceMappingURL=run.js.map