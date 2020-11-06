import { templateUI, ShellPropts } from "./templateUI";
import { initPlayback } from "./run";
import { assert } from "chai";
let state = {
	ctx: null,
	worker: null,
};
async function init() {
	let { cp, stdout, postRx1, appendNOde, appendScript } = templateUI();
	stdout("welcome");
	stdout("init_clock");

	if (!state.ctx) {
		state.ctx = new AudioContext({ sampleRate: 44100 });
	}
	if (state.ctx && !state.worker) {
		state.worker = await initPlayback(state.ctx, stdout, postRx1);
		state.worker.onmessage = ({ data: { msg, rx1, event } }) => {
			if (msg) stdout(msg);
			if (rx1) postRx1(rx1);
			if (event) stdout(event);
		};
	}
	appendScript(testF32);
}
export const u8_to_f32 = (f32: string) => {
	const ab = new AudioBuffer({
		numberOfChannels: 1,
		length: 1024,
		sampleRate: 9000,
	});
	const input: string = f32;
	const float = parseFloat(input);
	const f32arr = ab.getChannelData(0);
	f32arr[0] = float;
	const uint8_t_ptr = f32arr.buffer;
	const dv = new DataView(uint8_t_ptr);
	const uint32 = new DataView(uint8_t_ptr).getUint32(0);
	let sigbits = uint32 & (0x7fffff / 0x800000 - 1); // pull the significand
	const bias = (1 << 7) - 1;
	const exponent = (uint32 & 0x7fff) - bias;
	const signed = uint32 & 0x8000 ? -1 : 1;
	const result = signed * sigbits * Math.pow(2, exponent);

	function fmtf32(n: number) {
		return n
			.toString(2)
			.split("")
			.reduce(
				(str: string, c: string, i: number) =>
					`${str}${c}${(i + 1) % 4 ? "" : " "}`,
				""
			);
	}
	/*		\nsigbit:\t${sigbits} \exponent\t${exponent}\*/
	return `<pre>\ninput:\t${input}\tfloattt: \t${f32arr[0]} \
	\nbinary:\t${fmtf32(uint32)}\t\
	\nfinalAnser: ${result}</pre>`;
};
export const testF32: ShellPropts = {
	name: "float",
	prompt: "Enter float32 >",
	io: (str: string) => {
		if (str.match(/\d(.\d?)...\d.(\d?)/)) {
			let [t1, t2] = str.split("...");
			let ob = "";
			while (t1 < t2) {
				t1 += 0.1;
				ob = u8_to_f32(t1);
			}
			return ob;
		}
		if (!str.match(/\d.\d/)) {
			return "usage: [any number between -0.9999999 and 0.99999999";
		} else {
			return u8_to_f32(str);
		}
	},
};

window.onhashchange = (_e: HashChangeEvent) => {
	init().then(() => [
		state.worker.postMessage({
			sampleUrl: window.location.hash.substring(1),
		}),
	]);
};

window.addEventListener(
	"click",
	(e: MouseEvent) => {
		if (e.target instanceof HTMLLinkElement) {
			if (e.target.href) {
				state.worker.postMessage({
					sampleUrl: e.target.href.substring(1),
				});
			}
		}
	},
	{ once: true }
);
window.addEventListener("mousemove", init, { once: true });
