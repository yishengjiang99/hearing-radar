import { templateUI } from "./templateUI";

let state = {
	ctx: null,
	worker: null,
	stats: {
		rms: 0,
		buffered: 0,
		loss: 0,
	},
};
async function init() {
	let { cp, stdout, postRx1, appendNOde } = templateUI();
	stdout("welcome");
	stdout("init_clock");

	if (!state.ctx) {
		state.ctx = new AudioContext({ latencyHint: 3 });
	}
	if (state.ctx && !state.worker) {
		const [worker, processor] = await initPlayback(
			state.ctx,
			stdout,
			postRx1
		);
		state.worker = worker;
		state.worker.onmessage = ({ data: { msg, rx1, event, stats } }) => {
			if (msg) stdout(msg);
			if (stats) postRx1(JSON.stringify(stats));
			if (event) stdout(event);
			if (stats) state.stats = stats;
		};
	}
}

export async function initPlayback(
	ctx: AudioContext,
	stdout: (str: string) => void,
	postRx1: (str: string) => void
): Promise<[Worker, AudioWorkletNode]> {
	try {
		await ctx.audioWorklet.addModule("playback-processor.js", {});

		const node = new AudioWorkletNode(ctx, "playback-processor", {
			numberOfInputs: 0,
			numberOfOutputs: 1,
			outputChannelCount: [2],
		});
		node.connect(ctx.destination);
		const worker = new Worker("playback-worker.js", { type: "module" });
		worker.postMessage({ port: node.port }, [node.port]);
		stdout("worker init");
		await new Promise((resolve, reject) => {
			worker.onmessage = (e: MessageEvent) => resolve(e);
		});
		stdout("offline ctx init done");
		return [worker, node];
	} catch (e) {
		stdout("ERROR: " + e.message);
		throw e;
	}
}

document.querySelectorAll("a").forEach((a) =>
	a.addEventListener("click", async function (_e: MouseEvent) {
		_e.preventDefault();
		init().then(() => {
			state.worker.postMessage({ sampleUrl: a.href });
		});
	})
);
