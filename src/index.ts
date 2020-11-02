import { templateUI, createActionBtn } from "./templateUI";
import { initPlayback } from "./run";
let { cp, stdout, postRx1 } = templateUI();

const btn = createActionBtn(
	"start",
	"pause",
	(state) => {
		if (!state.ctx) {
			state.ctx = new AudioContext({ sampleRate: 9000 });
		}
		if (state.ctx && !state.playback) {
			initPlayback(state.ctx, stdout, postRx1).then((node) => {
				state.playback = node;
				state.ws = new WebSocket("ws://localhost:5150");
				state.ws.onopen = () => {
					state.ws.addEventListener("message", ({ data }) => {
						if (state.playback) {
							data.arrayBuffer().then((ab) => {
								console.log("posting");
								state.playback.port.postMessage(ab, [ab]);
							});
						}
					});
					state.ws.send("start");
				};
			});
		}
	},
	(state) => {
		if (state.ws) {
			state.ws.send("stop");
		}
	}
);
cp.appendChild(btn);
