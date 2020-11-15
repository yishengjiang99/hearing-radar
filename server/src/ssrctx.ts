import { spawn } from "child_process";
import { clear, time } from "console";
import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { PassThrough, Writable } from "stream";
import { AudioDataSource, FileSource, Oscillator } from "./audio-data-source";
import { wavHeader, readHeader } from "./wav-header";
import { extname } from "path";
const { write, read } = require("@xtuc/ieee754");
type Time = [number, number];
export const timediff = (t1: Time, t2: Time) => {
	return t1[0] + t1[1] / 1e9 - (t2[0] + t2[1] / 1e9);
};
//#region
export interface CtxProps {
	nChannels?: number;
	sampleRate?: number;
	fps?: number;
	bitDepth?: number;
}

//#endregion
export class SSRContext extends EventEmitter {
	encoder: Encoder;
	nChannels: number;
	playing: boolean;
	sampleRate: number;
	fps: number;
	lastFrame: Time;
	output: Writable;
	frameNumber: number;
	inputs: AudioDataSource[] = [];
	bitDepth: number;
	static fromWAVFile = (path: string): SSRContext => {
		return readHeader(path);
	};
	static fromFileName = (filename: string): SSRContext => {
		console.log(filename, filename.includes("-f32le"));
		const nChannels = filename.match(/\-ac(\d+)/)?.index || 2;
		const sampleRate = 44100; // ? filename.match(/\-ar(\d+)/).index
		const bitDepth = filename.includes("-f32le") ? 32 : 16;
		return new SSRContext({
			sampleRate,
			nChannels,
			bitDepth,
			fps: sampleRate / 128 / 50,
		});
	};

	static defaultProps: CtxProps = {
		nChannels: 2,
		sampleRate: 44100,
		bitDepth: 16,
	};
	end: number;

	constructor(props: CtxProps = SSRContext.defaultProps) {
		super();
		const { nChannels, sampleRate, fps, bitDepth } = {
			...SSRContext.defaultProps,
			...props,
		};
		this.nChannels = nChannels;
		this.sampleRate = sampleRate;
		this.fps = sampleRate / 128;
		this.frameNumber = 0;
		this.bitDepth = bitDepth;
		this.encoder = new Encoder(this.bitDepth);
		this.playing = true;
	}
	get secondsPerFrame() {
		return 1 / this.fps;
	}
	get samplesPerFrame() {
		return (this.sampleRate * this.nChannels) / this.fps;
	}
	get inputSources() {
		return this.inputs.filter((i) => i.active);
	}
	get WAVHeader() {
		return wavHeader(
			30 * this.sampleRate,
			this.sampleRate,
			this.nChannels,
			this.bitDepth
		);
	}
	encode(buffer: Buffer, value: number, index: number): void {
		this.encoder.encode(buffer, value, index);
	}

	get sampleArray() {
		switch (this.bitDepth) {
			case 32:
				return Uint32Array;
			case 16:
				return Int16Array;
			case 8:
				return Uint8Array;
			default:
				return Int16Array;
		}
	}
	pump(): boolean {
		this.lastFrame = process.hrtime();
		let ok = true;
		this.frameNumber++;
		for (let i = 0; i < this.inputSources.length; i++) {
			const b = this.inputSources[i].pullFrame();
			this.emit("data", b);
			if (this.output) this.output.write(b);
		}
		return ok;
	}
	get blockSize() {
		return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
	}
	get currentTime() {
		return this.frameNumber * this.secondsPerFrame;
	}
	connect(destination: Writable) {
		this.output = destination;
		this.output.on("stop", () => {
			this.stop(0);
		});
	}
	start = () => {
		this.playing = true;
		if (this.output === null) return;
		let that = this;

		let timer = setInterval(() => {
			that.pump();
			if (!that.playing || (that.end && that.currentTime >= that.end)) {
				that.stop(0);
				clearInterval(timer);
			}
		}, this.secondsPerFrame);
	};
	getRms() {}

	stop(second?: number) {
		if (second === 0) {
			this.playing = false;
			this.emit("end");
			this.inputs.forEach((input) => input.stop());
		} else {
			this.end = second;
		}
	}
}
export class Encoder {
	bitDepth: number;
	constructor(bitDepth: number) {
		this.bitDepth = bitDepth;
	}
	encode(buffer: Buffer, value: number, index: number): void {
		let f = value;
		const dv = new DataView(buffer.buffer);
		switch (this.bitDepth) {
			case 32:
				write(buffer, value, index * 4, 23, 4);
				break;
			case 16:
				value = Math.min(Math.max(-1, value), 1);
				value < 0
					? dv.setInt16(index * 2, value * 0x8000, true)
					: dv.setInt16(index * 2, value * 0x7fff, true);
				break;
			case 8:
				buffer.writeUInt8(value, index * Uint8Array.BYTES_PER_ELEMENT);
				break;
			default:
				throw new Error("unsupported bitdepth");
		}
	}
}
// const ctx = new SSRContext({
// 	nChannels: 2,
// 	bitDepth: 16,
// 	sampleRate: 9000,
// });

// ctx.stop(0.1);
// ctx.start();
// const t = setInterval(() => {
// 	process.stdout.write("*");
// 	if (ctx.playing === false) {
// 		console.log(process.uptime());
// 		clearInterval(t);
// 	}
// }, 10);
// fss.connect(ctx);
// ctx.start();

// require("grep-wss").WebSocketServer({
// 	onConnection: (reply) => {
// 		console.log("gg");
// 	},
// 	onData: (data, ws) => {
// 		ctx.connect(ws.socket);
// 		ctx.start();
// 	},
// 	port: 5150,
// });
// const ctx = new SSRContext({
// 	nChannels: 2,
// 	bitDepth: 16,
// 	sampleRate: 44100,
// });

// ctx.stop(0.01);
// ctx.start();
// let tick = process.hrtime();
// const nc = () => timediff(process.hrtime(), tick);
// setTimeout(() => {
// 	console.log(nc(), ctx.currentTime);
// 	setTimeout(() => {
// 		console.log(nc(), ctx.currentTime);
// 		setTimeout(() => {
// 			console.log(nc(), ctx.currentTime);
// 			setTimeout(() => {
// 				console.log(nc(), ctx.currentTime);
// 			}, 100);
// 		}, 100);
// 	}, 100);
// }, 100);
// let t0 = process.hrtime();
// function loop() {
// 	console.log(timediff(process.hrtime(), t0));
// 	t0 = process.hrtime();
// 	process.nextTick(loop);
// }
// loop();
