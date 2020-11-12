import { spawn } from "child_process";
const { write, read } = require("@xtuc/ieee754");
export function F32toU32(f) {
	return write(f);
	if (!f) return 0;
	let shift, sign, fnorm;
	shift = 0;

	if (f < 0) {
		sign = 1;
		fnorm = -f;
	} else {
		sign = 0;3
		fnorm = f;
	}

	while (fnorm >= 2.0) {
		fnorm /= 2.0;
		shift++;
	}
	while (fnorm < 1.0) {
		fnorm *= 2;
		shift--;
	}
	fnorm = fnorm - 1;
	const sigfigs = fnorm * ((1 << 23) + 0.5);
	const exp = shift + ((1 << (8 - 1)) - 1);
	return (exp << 23) | sigfigs;
}
export function U32toF32(i) {
	if (i === 0) return 0;
	let r = i & ((1 << 23) - 1);
	1;
	r /= 1 << 23;
	r += 1.0;
	const bias = 127;
	let shift = ((i >> 23) & 0xff) - bias;
	for (; shift > 0; shift--) r *= 2;
	for (; shift < 0; shift++) r /= 2;
	return r;
}
let input = 0;
if (require.main == module)
	process.stdin.on("data", (d) => {
		const c = d.toString().trim();
		switch (c) {
			case "s":
				input -= 0.0001;
				break;

			case "d":
				input += 0.0001;
				break;
			case "f":
				input *= 1.1;
				break;
			case "a":
				input /= 1.1;
				break;
			default:
				input = parseFloat(d.toString());
				break;
		}
		const bits = F32toU32(input);
		const ff = U32toF32(bits);
		let o = `\ninput:\t ${input}\n${bits.toString(
			2
		)}\nu32:\t${bits.toString(16)}\nf32\t${ff}\n`;
		process.stdout.write(o);
	});