import { Writable } from "stream";
import { AudioDataSource, FileSource, Oscillator } from "./audio-data-source";
import { spawn } from "child_process";
import { createServer, createConnection, Socket } from "net";

const timediff = (t1: number, t2: number) => {
	return t1 - t2;
};
//#region
export interface CtxProps {
	nChannels?: number;
	sampleRate?: number;
	fps?: number;
	bitDepth?: 32 | 16 | 8;
}
//#endregion
export class SSRContext {
	encoder: Encoder;
	nChannels: number;
	playing: boolean;
	sampleRate: number;
	fps: number;
	t0: number;
	lastFrame: number;
	output: Writable;
	frameNumber: number;
	inputs: AudioDataSource[] = [];
	bitDepth: 32 | 16 | 8;

	static defaultProps: CtxProps = {
		nChannels: 2,
		sampleRate: 44100,
		fps: 44100 / 128,
		bitDepth: 32,
	};

	constructor(props: CtxProps = SSRContext.defaultProps) {
		const { nChannels, sampleRate, fps, bitDepth } = {
			...props,
			...SSRContext.defaultProps,
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

	encode(buffer: Buffer, value: number, index: number): void {
		this.encoder.encode(buffer, value, index);
	}

	get sampleArray() {
		switch (this.bitDepth) {
			case 32:
				return Float32Array;
			case 16:
				return Int16Array;
			case 8:
				return Uint8Array;
			default:
				return Int16Array;
		}
	}
	pump(): boolean {
		let ok = true;
		for (let i = 0; i < this.inputSources.length; i++) {
			ok = ok && this.output.write(this.inputSources[i].pullFrame());
		}
		return ok;
	}
	get blockSize() {
		return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
	}
	get currentTime() {
		return timediff(process.uptime(), this.t0);
	}
	connect(destination: Writable) {
		this.output = destination;
	}
	start = () => {
		console.log("starting");
		this.t0 = process.uptime();
		this.playing = true;
		let that = this;
		let ok = true;
		this.output.on("drain", () => (ok = true));
		function loop() {
			if (that.playing === false) return;
			if (!that.lastFrame) {
				that.lastFrame = process.uptime();
				that.pump();
				that.frameNumber++;
				setTimeout(loop, 0);
			}
			const elapsed = timediff(process.uptime(), that.lastFrame);
			//console.log(backpressure, elapsed);
			if (!that.lastFrame || elapsed > that.secondsPerFrame) {
				that.lastFrame = process.uptime();
				that.pump();
				that.frameNumber++;
			}
			setTimeout(loop, 0);
		}
		setImmediate(loop);
	};

	stop() {
		this.playing = false;
	}
}
export class Encoder {
	bitDepth: number;
	constructor(bitDepth: 32 | 16 | 8) {
		this.bitDepth = bitDepth;
	}
	encode(buffer: Buffer, value: number, index: number): void {
		value = Math.max(-1, Math.min(value, +1));
		switch (this.bitDepth) {
			case 32:
				buffer.writeInt32LE(
					value > 0 ? value * 0x7fffffff : value * 0x80000000,
					index * Float32Array.BYTES_PER_ELEMENT
				);
				break;
			case 16:
				buffer.writeInt16LE(
					value > 0 ? value * 0x7fff : value * 0x8000,
					index * Int16Array.BYTES_PER_ELEMENT
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
// const ctx = new SSRContext({
// 	nChannels: 1,
// 	sampleRate: 44100,
// 	fps: 44100 / 128,
// 	bitDepth: 32,
// });
// const osc = new Oscillator(ctx, { frequency: 440 });
// const filesrc = new FileSource(ctx, { filePath: "../no-dout-f32le.pcm" });
// filesrc.connect(ctx);

// ctx.connect(process.stdout);
// // require("child_process").execSync(
// // 	"nc -Ul /tmp/ipc2.sock & ffplay -ac 1 -ar 9000 -f s16le -i unix:/tmp/ipc2.sock"
// // );
// ctx.start();
