import { templateUI, createActionBtn } from "./templateUI";
import { initPlayback } from "./run";
let { cp, stdout, postRx1, appendNOde } = templateUI();
stdout("welcome");
stdout("init_clock");
let state = {
	ctx: null,
	worker: null,
};
async function init() {
	if (!state.ctx) {
		state.ctx = new AudioContext({ sampleRate: 48000 });
	}
	if (state.ctx && !state.worker) {
		state.worker = await initPlayback(state.ctx, stdout, postRx1);
		state.worker.onmessage = ({ data: { msg, rx1, event } }) => {
			if (msg) stdout(msg);
			if (rx1) postRx1(rx1);
			if (msg) stdout(event);
		};
	}
}
window.onhashchange = (e: HashChangeEvent) => {
	init().then(() => [
		state.worker.postMessage({
			sampleUrl: window.location.hash.substring(1),
		}),
	]);
};
window.addEventListener("click", init, { once: true });
window.addEventListener("mousemove", init, { once: true });
