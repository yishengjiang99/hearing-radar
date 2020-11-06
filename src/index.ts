import { templateUI, ShellPropts } from "./templateUI";
import { initPlayback } from "./run";
import { assert } from "chai";
let state = {
	ctx: null,
	worker: null,
};
async function init() {
	let { cp, stdout, postRx1, appendNOde } = templateUI();
	stdout("welcome");
	stdout("init_clock");

	// if (!state.ctx) {
	// 	state.ctx = new AudioContext({ sampleRate: 44100 });
	// }
	// if (state.ctx && !state.worker) {
	// 	state.worker = await initPlayback(state.ctx, stdout, postRx1);
	// 	state.worker.onmessage = ({ data: { msg, rx1, event } }) => {
	// 		if (msg) stdout(msg);
	// 		if (rx1) postRx1(rx1);
	// 		if (event) stdout(event);
	// 	};
	// }
	document.addEventListener("click", function (_e: MouseEvent) {
		//	stdout(typeof e.target);
		test1(stdout);
	});
}
export const testF32: ShellPropts = {
	name: "float32 for (-1.0, 1.0)",
	prompt: "Enter float32 >",
	io: (str: string) => {
		if (!str.match(/\d.\d/)) {
			return "usage: [any number between -0.9999999 and 0.99999999";
		}
		const ab = new AudioBuffer({
			numberOfChannels: 1,
			length: 1024,
			sampleRate: 9000,
		});
		const input: string = str;
		const float = parseFloat(input);
		const f32arr = ab.getChannelData(0);
		f32arr[0] = float;
		const uint8_t_ptr = f32arr.buffer;
		const uint32 = new DataView(uint8_t_ptr).getUint32(0);
		let rr1 = uint32 & 0x7fffff;
		rr1 = rr1 / 0x800000 + 1;
		const bias = (1 << 7) - 1;
		const shift = uint32 & 0x7f;
		let shift3 = shift & ((1 << 6) - 1);
		const expb = uint32 & 0x7f;

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

		return `<pre>\nfloat: \t${f32arr[0]} \
		\nbinary:\t${fmtf32(uint32)} \
		\nexpbit:\t${expb.toString(2)} \
		\nsigbit:\t${rr1}\tshift: ${shift3 - bias} \
		\n</pre>`;
	},
};
// function test1(stdout) {
// 	const off = new OfflineAudioContext(1, 80, 8000);
// 	const ab = new AudioBuffer({
// 		numberOfChannels: 1,
// 		sampleRate: 8000,
// 		length: 5,
// 	});

// 	const d: Float32Array = ab.getChannelData(0);
// 	d[0] = 0.00001;
// 	d[1] = 0.000001;
// 	d[2] = 0.00000001;
// 	d[3] = 0.000000005;
// 	d[4] = 0.0000000025;
// 	let v = 0;
// 	stdout("reset clock");
// 	const uint = ab.getChannelData(0).buffer;
// 	const dv = new DataView(uint);
// 	let str = "";
// 	const mask = (1 << 8) - 1;
// 	stdout(mask.toString(16));

// 	const expBit = 8;
// 	const sigbit = 23;

// 	ab.getChannelData(0).forEach((v, i, _arr) => {
// 		const uint32 = dv.getUint32(i * 4);
// 		let rr1 = uint32 & 0x7fffff;
// 		rr1 = rr1 / 0x800000 + 1;
// 		const bias = (1 << 7) - 1;
// 		const shift = uint32 & 0x7f;
// 		let shift3 = shift & ((1 << 6) - 1);
// 		const expb = uint32 & 0x7f;
// 		str += `\nfloat:\t${d[i]}:\nbinary:\t${fmtf32(
// 			dv.getUint32(i * 4).toString(2)
// 		)}\nexpbit:\t${expb.toString(2)}\nsigbit:\t${rr1}\tshift: ${
// 			shift3 - bias
// 		}\r\n`;
// 	});
// 	function fmtf32(chars) {
// 		// assert(chars.length == 32, "fail " + chars.length);
// 		return chars
// 			.split("")
// 			.map(
// 				(c, i) =>
// 					c +
// 					`${[3, 7, 11, 15, 19, 23, 27].indexOf(i) > -1 ? " " : ""}`
// 			)
// 			.join("");
// 	}
// 	stdout("<pre>" + str + "</pre>");
// }

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
