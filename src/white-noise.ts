import { getCtx } from "./ctx";
import { ADSR } from "./types";
import { envelope } from "./envelope";
export const whiteNoise = ({ adsr }) => {
	const audioCtx = getCtx();
	// Create an empty three-second stereo buffer at the sample rate of the AudioContext
	const myArrayBuffer = audioCtx.createBuffer(
		2,
		audioCtx.sampleRate * 3,
		audioCtx.sampleRate
	);

	// Fill the buffer with white noise;
	// just random values between -1.0 and 1.0
	for (let channel = 0; channel < myArrayBuffer.numberOfChannels; channel++) {
		// This gives us the actual ArrayBuffer that contains the data
		const nowBuffering = myArrayBuffer.getChannelData(channel);
		for (let i = 0; i < myArrayBuffer.length; i++) {
			// Math.random() is in [0; 1.0]
			// audio needs to be in [-1.0; 1.0]
			nowBuffering[i] = Math.random() * 2 - 1;
		}
	}

	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	const source = audioCtx.createBufferSource();
	return source;
};
