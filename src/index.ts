import { templateUI } from "./templateUI";
const { stdout, rx1Div, postRx1, postRx2, cp, appendNOde } = templateUI();
const ctx = new AudioContext({
	sampleRate: 48000,
	latencyHint: "playback",
});
ctx.audioWorklet.addModule("playback-processor.js").then(() => {
	const node = new AudioWorkletNode(ctx, "playback-processor", {
		numberOfInputs: 0,
		numberOfOutputs: 1,
		outputChannelCount: [2],
	});
});
