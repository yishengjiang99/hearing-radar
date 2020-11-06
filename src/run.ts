export type initUploadFunction = (
	ctx: AudioContext,
	stdout?: (str: string) => void
) => {
	uploadProcessor: AudioWorkletNode;
	worker: Worker;
	source: MediaStreamAudioSourceNode;
	postGain: GainNode;
	analyzer: AnalyserNode;
};
export async function initUploader(
	ctx: AudioContext,
	stdout?: (str: string) => void,
	rx1?: (str: string) => void
) {
	try {
		await ctx.audioWorklet.addModule(
			"upload-processor.js?t=" + new Date().getMilliseconds()
		);
		const uploadProcessor = new AudioWorkletNode(ctx, "upload-processor");

		stdout("upload proc loaded");
		const worker = new Worker(
			"upload-worker.js?t=" + new Date().getMilliseconds(),
			{ type: "module" }
		);
		worker.postMessage({ port: uploadProcessor.port }, [
			uploadProcessor.port,
		]);
		worker.onmessage = ({ data }) => {
			data.msg && stdout(data.msg);
			data.rx1 && rx1(data.rx1);
		};

		const micStream = await navigator.mediaDevices.getUserMedia({
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
	} catch (e) {
		alert(e.message);
	}
}
// export const readReader = async (rs: ReadableStream) => {
// 	rs.getReader({ mode: "byob" }).read(new Uint8Array(1024))
// };
export const msgEventReader = async (port: MessagePort) => {
	const ws = new WebSocket("ws://localhost:5150");
	await new Promise((resolve, reject) => {
		ws.onopen = () => {
			const { readable, writable } = new TransformStream();
			// port.postMessage({ readable }, [readable]);
			ws.onmessage = (event) => {
				const b: Blob = event.data;
				// new Response(b).body.pipeTo(writable) .stream().getReader().pipeTo(writable);
			};
			resolve();
		};
	});
};

export async function initPlayback(
	ctx: AudioContext,
	stdout: (str: string) => void,
	postRx1: (str: string) => void
): Promise<Worker> {
	try {
		await ctx.audioWorklet.addModule(
			URL.createObjectURL(
				new Blob(
					[await (await fetch("playback-processor.js")).blob()],
					{
						type: "application/javascript",
					}
				)
			)
		);
		const node = new AudioWorkletNode(ctx, "playback-processor", {
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [2],
		});
		stdout("worklet init");

		node.connect(ctx.destination);
		node.port.onmessage = ({ data: { rx1 } }) => {
			postRx1(rx1 + "");
		};
		const worker = new Worker("playback-worker.js", { type: "module" });
		worker.postMessage({ port: node.port }, [node.port]);
		stdout("worker init");

		await new Promise((resolve, reject) => {
			worker.onmessage = (e: MessageEvent) => resolve(e);
		});
		stdout("offline ctx init done");

		return worker;
	} catch (e) {
		stdout("ERROR: " + e.message);
		throw e;
	}
}
