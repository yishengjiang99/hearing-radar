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
			"./upload-processor.js?t=" + new Date().getMilliseconds()
		);
		const uploadProcessor = new AudioWorkletNode(ctx, "upload-processor");

		stdout("upload proc loaded");
		const worker = new Worker(
			"./upload-worker.js?t=" + new Date().getMilliseconds()
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
export async function initPlayback(
	ctx: AudioContext,
	stdout?: (str: string) => void,
	postRx1?: (str: string) => void
): Promise<AudioWorkletNode> {
	try {
		await ctx.audioWorklet.addModule(
			"./playback-processor.js?t=" + new Date().getUTCMilliseconds()
		);
		const node = new AudioWorkletNode(ctx, "playback-processor", {
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [1],
		});
		node.connect(ctx.destination);
		node.port.onmessage = ({ data: { rx1 } }) => {
			postRx1(rx1 + "");
		};
		return node;
	} catch (e) {
		stdout("ERROR: " + e.message);
	}
}
