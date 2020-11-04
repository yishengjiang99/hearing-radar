class PlaybackProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.buffers = [];
		// this.fifo = Fifo(1024 * 10);
		this.port.postMessage("initialized");
		this.port.onmessage = async ({ data: { readable } }) => {
			let reader = await readable.getReader();
			let that = this;
			reader.read().then(function process({ done, value }) {
				if (done) {
					that.port.postMessage({ done: 1 });
					return;
				}
				let offset = 0;
				while (value.length >= 128) {
					that.buffers.push(value.slice(0, 128));
					value = value.slice(128);
				}
				reader.read().then(process);
			});
		};
	}

	process(inputs, outputs, parameters) {
		if (this.buffers.length === 0) {
			return true;
		}
		const dv = this.buffers.shift();
		for (let i = 0; i < 128; i++) {
			outputs[0][0][i] = dv[i];
			outputs[0][1][i] = dv[i]; //* 2];
		}
		// const rsum = outputs[0][0].reduce((sum, v, idx) => {
		// 	return (sum += v * v);
		// }, 0);
		// this.port.postMessage({ rx1: Math.sqrt(rsum / 128) });
		return true;
	}
}
registerProcessor("playback-processor", PlaybackProcessor);
