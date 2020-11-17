import { templateUI } from "./templateUI";
const { stdout, rx1Div, postRx1, postRx2, cp, appendNOde } = templateUI();
export const initworker = async () => {
	const ctx = new AudioContext({
		sampleRate: 48000,
		latencyHint: "playback",
	});
	await ctx.audioWorklet.addModule("playback-processor.js", {});

	const node = new AudioWorkletNode(ctx, "playback-processor", {
		numberOfInputs: 0,
		numberOfOutputs: 1,
		outputChannelCount: [2],
	});
	node.onprocessorerror = (ev: Event) => alert(ev.type);
	const worker = new Worker("playback-worker.js", { type: "module" });
	await ctx.suspend();
	worker.postMessage({ port: node.port }, [node.port]);
	stdout(ctx.sampleRate + " sr");
	stdout("worker init");
	await new Promise((resolve, reject) => {
		worker.onmessage = (e: MessageEvent) => resolve(e);
	});
	stdout("worker done");
	node.connect(ctx.destination);

	return {
		ctx,
		node,
		worker,
	};
};
initworker().then(({ ctx, node, worker }) => {
	worker.onmessage = ({ data: { msg, stats, pstats, event } }) => {
		if (msg) {
			stdout(msg);
		}
		if (stats) {
			postRx1(JSON.stringify(stats));
		}
		if (pstats) {
			postRx2(JSON.stringify(pstats));
		}
		if (event) {
			stdout(event);
		}
	};

	document.querySelectorAll("button").forEach((a) =>
		a.addEventListener("click", async function (_e: MouseEvent) {
			_e.preventDefault();
			if (ctx.state === "suspended") {
				ctx.onstatechange = () => {
					worker.postMessage({ sampleUrl: a.getAttribute("href") });
				};
				ctx.resume();
			} else {
				worker.postMessage({ sampleUrl: a.getAttribute("href") });
			}

			return false;
		})
	);
});

//loadURL("samples/white-noise-mono.wav");

/*
	sample rate, sample rate * block align, channel count * bytes per sample, bits per sample 
*/

//# sourceMappingURL=wavheader.js.map
