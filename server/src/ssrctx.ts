import { spawn } from "child_process";
import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { Writable } from "stream";
import { AudioDataSource, FileSource, Oscillator } from "./audio-data-source";
import { wavHeader } from "./wav-header";
const { write, read } = require("@xtuc/ieee754");
type Time = [number, number];
const timediff = (t1: Time, t2: Time) => {
	return t1[0] - t2[0] + (t1[1] - t2[1]) / 0xffffffff;
};
//#region
export interface CtxProps {
	nChannels?: number;
	sampleRate?: number;
	fps?: number;
	bitDepth?: 32 | 16 | 8;
}
//#endregion
export class SSRContext extends EventEmitter {
	encoder: Encoder;
	nChannels: number;
	playing: boolean;
	sampleRate: number;
	fps: number;
	t0: Time;
	lastFrame: Time;
	output: Writable;
	frameNumber: number;
	inputs: AudioDataSource[] = [];
	bitDepth: 32 | 16 | 8;
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
		fps: 44100 / 128,
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
		this.fps = fps;
		this.frameNumber = 0;
		this.bitDepth = bitDepth;
		this.encoder = new Encoder(this.bitDepth);
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
				return Uint16Array;
			case 8:
				return Uint8Array;
			default:
				return Int16Array;
		}
	}
	pump(): boolean {
		let ok = true;
		if (!this.output) return false;
		for (let i = 0; i < this.inputSources.length; i++) {
			const b = this.inputSources[i].pullFrame();
			const good = this.output.write(b);
		}

		return ok;
	}
	get blockSize() {
		return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
	}
	get currentTime() {
		return timediff(process.hrtime(), this.t0);
	}
	connect(destination: Writable) {
		this.output = destination;
		this.start();
	}
	start = () => {
		console.log("starting", this.bitDepth, this.blockSize);

		this.t0 = process.hrtime();
		this.playing = true;
		if (this.output === null) return;
		let that = this;
		let ok = true;
		function loop() {
			if (that.playing === false) return;
			const diff = timediff(process.hrtime(), that.lastFrame);
			if (diff >= that.secondsPerFrame) {
				that.lastFrame = process.hrtime();
				ok = that.pump();
				that.frameNumber++;
				if (that.end && that.currentTime >= that.end) that.stop(0);
				if (that.frameNumber) setImmediate(loop);
			} else {
				setImmediate(loop);
			}
		}
		this.lastFrame = process.hrtime();
		this.pump();

		setImmediate(loop);
	};
	getRms() {}

	stop(ms?: number) {
		if (ms === 0) {
			this.playing = false;
			this.emit("end");
		} else {
			this.end = ms;
		}
	}
}
export class Encoder {
	bitDepth: number;
	constructor(bitDepth: 32 | 16 | 8) {
		this.bitDepth = bitDepth;
	}
	encode(buffer: Buffer, value: number, index: number): void {
		let f = value;
		switch (this.bitDepth) {
			case 32:
				write(buffer, value, index * 4, 23, 4);
				break;
			case 16:
				value = Math.max(Math.max(-1, value), 1);
				buffer.writeUInt16LE(
					value > 0 ? value * 0x7fff : 0x10000 - value * 0x8000,
					index * Uint16Array.BYTES_PER_ELEMENT
				);
				break;
			case 8:
				buffer.writeUInt8(value, index * Uint8Array.BYTES_PER_ELEMENT);
				break;
			default:
				throw new Error("unsupported bitdepth");
		}
	}
}

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
