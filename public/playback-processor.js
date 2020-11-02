const bufferSampleSize = 2 << 11;
const sizePerSample = 4;
const uint8ToFloat = (int1, int2) => {
	return ((int2 << 8) | int1) / 0xffff;
};
class PlaybackProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.buffers = [];
		this.port.postMessage("initialized");
		this.port.onmessage = ({ data }) => {
			for (let i = 0; i < data.byteLength; i += 128 * 2 * 2) {
				this.buffers.push(new Int16Array(data, i));
			}
		};
	}

	process(inputs, outputs, parameters) {
		if (this.buffers.length) {
			const outputBuffer = this.buffers.shift();
			for (let i = 0; i < 128; i++) {
				outputs[0][0][i] = outputBuffer[i] / 255;
				// outputs[0][1][i] = outputBuffer[i * 2 + 1] / 255;
			}
		}
		const rsum = outputs[0][0].reduce((sum, v, idx) => {
			sum += v * v;
		}, 0);
		this.port.postMessage({ rx1: Math.sqrt(rsum / 128) });
		return true;
	}
}
registerProcessor("playback-processor", PlaybackProcessor);
