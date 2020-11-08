import { Writable } from "stream";
import { AudioDataSource, FileSource, Oscillator } from "./audio-data-source";
import { F32toU32, U32toF32 } from "./kodak";
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
export class SSRContext {
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
		const nChannels = filename.match(/\-ac(\d+)/)?.index || 2;
		const sampleRate = filename.match(/\-ar(\d+)/)?.index || 44100; // ? filename.match(/\-ar(\d+)/).index
		const bitDepth = filename.includes("-f32le") ? 32 : 16;
		console.log(
			"arsed ",
			{
				sampleRate,
				nChannels,
				bitDepth,
				fps: sampleRate / 128,
			},
			filename
		);
		return new SSRContext({
			sampleRate,
			nChannels,
			bitDepth,
			fps: sampleRate / 128,
		});
	};

	static defaultProps: CtxProps = {
		nChannels: 2,
		sampleRate: 44100,
		fps: 44100 / 128,
		bitDepth: 32,
	};
	end: number;

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
		let ok = true;
		for (let i = 0; i < this.inputSources.length; i++) {
			const b = this.inputSources[i].pullFrame();
			console.log(b.byteLength);
			this.output.write(b);
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
	}
	start = () => {
		console.log("starting");
		this.t0 = process.hrtime();
		this.playing = true;
		let that = this;
		let ok = true;
		function loop() {
			if (that.playing === false) return;
			if (that.end <= that.frameNumber) return;
			if (
				timediff(process.hrtime(), that.lastFrame) >
				0.8 * that.secondsPerFrame
			) {
				that.lastFrame = process.hrtime();
				ok = that.pump();
				that.frameNumber++;
			}
			setTimeout(loop, 1);
		}
		this.lastFrame = process.hrtime();
		this.pump();

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
		let f = value;
		switch (this.bitDepth) {
			case 32:
				buffer.writeUInt32LE(F32toU32(value), index);
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

// filesrc.connect(ctx);

// ctx.connect(process.stdout);
// // require("child_process").execSync(
// // 	"nc -Ul /tmp/ipc2.sock & ffplay -ac 1 -ar 9000 -f s16le -i unix:/tmp/ipc2.sock"
// // );
// ctx.start();
