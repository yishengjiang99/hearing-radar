import { Writable } from "stream";
import { createWriteStream } from "fs";
const atob = require("atob");
import { AudioDataSource, Oscillator } from "./AudioDataSource";
type Time = [number, number];
const timediff = (t1: Time, t2: Time) => {
	// console.log(t1[0] - t2[0] + (t1[1] - t2[1]) / 0xffffffff);
	return t1[0] - t2[0] + (t1[1] - t2[1]) / 0xffffffff;
};

export class SSRContext {
	nChannels: number;
	playing: boolean;
	sampleRate: number;
	fps: number;
	t0: Time;
	lastFrame: Time;
	secondsPerFrame: number;
	destination: Writable;
	samplesPerFrame: number;
	frameNumber: number;
	inputs: AudioDataSource[] = [];
	buffer: Buffer;

	constructor(props: { nChannels: number; sampleRate: number; fps: number }) {
		const { nChannels, sampleRate, fps } = props;
		this.nChannels = nChannels;
		this.sampleRate = sampleRate;
		this.fps = fps;
		this.secondsPerFrame = 1 / this.fps;
		this.samplesPerFrame = this.sampleRate / this.fps;
		this.frameNumber = 0;
	}
	get inputSources() {
		return this.inputs.filter((i) => i.active);
	}
	get channelData() {
		const frame = Buffer.alloc(
			Int16Array.BYTES_PER_ELEMENT * this.samplesPerFrame * this.nChannels
		).fill(0);
		const frame16 = new Int16Array(frame);
		const activeInputs = this.inputSources;

		for (let i = 0; i < activeInputs.length; i++) {
			const track = activeInputs[i].pullFrame();
			for (let j = 0; j < this.samplesPerFrame; j++) {
				for (let n = 0; n < this.nChannels; n++) {
					frame.writeInt16LE(
						frame16[j * this.nChannels + n] +
							track[j * this.nChannels + n] / activeInputs.length,
						Int16Array.BYTES_PER_ELEMENT * (j * this.nChannels + n)
					);
				}
			}
		}
		return frame;
	}
	get blockSize() {
		return (this.sampleRate / this.fps) * this.nChannels;
	}
	get currentTime() {
		return timediff(process.hrtime(), this.t0);
	}
	connect(destination: Writable) {
		this.destination = destination;
	}
	start = () => {
		this.playing = true;
		let that = this;
		function loop() {
			if (that.playing === false) return;
			if (
				!that.lastFrame ||
				timediff(process.hrtime(), that.lastFrame) >=
					that.secondsPerFrame
			) {
				that.lastFrame = process.hrtime();
				console.log(that.lastFrame);
				const withoutBackPressure = that.destination.write(
					that.channelData
				);
				if (withoutBackPressure) that.destination.once("drain", loop);
				else setTimeout(loop, 1);
				that.frameNumber++;
			}
			setTimeout(loop, 1);
		}
		setImmediate(loop);
	};

	stop() {
		this.playing = false;
	}
}
