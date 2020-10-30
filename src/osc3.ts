import { Frequency, Midi, ADSR, Percent } from "./types";
import { envelope } from "./envelope";
import { getCtx } from "./ctx";
export const frequencyToMidi = (f: Frequency): Midi =>
	~~(12 * Math.log2(f / 440) + 69);
export interface OSC3Props {
	hpf?: Frequency;
	adsr?: ADSR;
	when?: number;
	duration?: number;
	types?: OscillatorType[];
	overtoneAttunuate?: [Percent, Percent, Percent];
	ctx?: BaseAudioContext;
}
export const defaultOsc3Props: OSC3Props = {
	hpf: -1,
	adsr: [0.02, 0.1, 0.7, 0.5],
	overtoneAttunuate: [1.4, 1, 0.5],
	types: ["sine", "sine", "sine"],
	when: 0,
	duration: 0.125,
};

export const osc3 = (baseNote: Frequency, _props: OSC3Props = {}) => {
	const props: OSC3Props = {
		...defaultOsc3Props,
		..._props,
	};
	const { duration, when, adsr, hpf, types } = props;
	const ctx = props.ctx || getCtx();

	const merger = new ChannelMergerNode(ctx, {
		numberOfInputs: 3,
	});

	[baseNote, baseNote * 2, baseNote * 4].map((freq, idx) => {
		const osc = new OscillatorNode(ctx, {
			frequency: freq,
			type: types[idx] || "sine",
		});
		osc.connect(
			new GainNode(ctx, { gain: props.overtoneAttunuate[idx] })
		).connect(merger, 0, idx);
		osc.start(ctx.currentTime + when);
		osc.stop(ctx.currentTime + when + duration);
	});

	const gain = new GainNode(ctx);
	envelope(ctx, gain.gain, props.adsr, ctx.currentTime);
	const postAmp = new GainNode(ctx);
	if (hpf === -1) {
		merger.connect(gain).connect(postAmp); //connect(ctx.destination);
	} else {
		const lowpass = new BiquadFilterNode(ctx, {
			type: "highpass",
			frequency: props.hpf,
			Q: 2,
			gain: 2,
		});
		merger.connect(gain);
		gain.connect(lowpass);
		lowpass.connect(postAmp);
	}

	return postAmp;
};

export let osc3run = (
	baseFrequency: Frequency,
	when?: number,
	duration?: number
) => osc3(baseFrequency, { when: when || 0, duration: duration || 0.25 });

export const scale = (baseNote: Frequency) => {};
