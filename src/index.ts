import { templateUI, createActionBtn } from "./templateUI";
import { initPlayback } from "./run";
let { cp, stdout, postRx1, appendNOde } = templateUI();
stdout("welcome");
stdout("init_clock");

const btn = createActionBtn(
	"start",
	"pause",
	(state) => {
		if (!state.ctx) {
			state.ctx = new AudioContext({ sampleRate: 44100 });
		}
		if (state.ctx && !state.playback) {
			initPlayback("http://localhost:4000/", state.ctx, stdout, postRx1)
				.then(({ worker, initMsg }) => {
					state.worker = worker;
					initMsg.data.split("|").map((filename) => {
						const link = document.createElement("a");
						link.onclick = () => {
							worker.postMessage({
								sampleUrl: `http://localhost:4000/file/${filename}`,
							});
						};
						link.textContent = filename;
						link.href = "#" + filename;
						appendNOde(link, filename);
					});
					worker.onmessage = (e) => {
						const {
							data: { msg, rx1 },
						} = e;
						if (msg) stdout(msg);
						if (rx1) postRx1(rx1);
					};
				})
				.catch(console.log);
		}
	},
	(state) => {
		if (state.ws) {
			state.ws.send("stop");
		}
	}
);
cp.appendChild(btn);
