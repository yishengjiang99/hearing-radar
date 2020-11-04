import { SSRContext } from "./ssrctx";
import { openSync, readSync, read } from "fs";
import { Readable } from "stream";
import { EventEmitter } from "events";
const Fifo = require("grep-fifo");

export interface AudioDataSource {
	ctx: SSRContext;
	active: boolean;
	// new (ctx: SSRContext, opts: any): AudioDataSource;
	pullFrame: () => Buffer;
	connect: (destination: SSRContext) => boolean;
}

export class Oscillator implements AudioDataSource {
	ctx: SSRContext;
	frequency: any;
	active: boolean = true;
	bytesPerSample: number;
	constructor(ctx: SSRContext, { frequency }) {
		this.ctx = ctx;
		this.frequency = frequency;
		this.bytesPerSample = this.ctx.sampleArray.BYTES_PER_ELEMENT;
	}
	pullFrame(): Buffer {
		const frames = Buffer.allocUnsafe(this.ctx.blockSize);
		const n = this.ctx.frameNumber;
		const cyclePerSample =
			(3.14 * 2 * this.frequency) / this.ctx.sampleRate;
		const cyclePerFrame = (3.14 * 2 * this.frequency) / this.ctx.fps;
		const phase = this.ctx.frameNumber * cyclePerFrame;
		for (let i = 0; i < this.ctx.samplesPerFrame; i++) {
			const idx = ~~(i / this.ctx.nChannels);
			this.ctx.encode(frames, Math.sin(phase + cyclePerSample * idx), i);
		}
		return frames;
	}
	connect(dest: SSRContext) {
		dest.inputs.push(this);
		return true;
	}
}

export class FileSource extends EventEmitter implements AudioDataSource {
	offset: number;
	fd: number;
	ctx: SSRContext;
	active: boolean = true;
	output: Buffer;
	rptr: number;

	constructor(ctx: SSRContext, { filePath }) {
		super();
		this.fd = openSync(filePath, "r");
		this.ctx = ctx;
		this.offset = 0;
		this.output = Buffer.alloc(0);
		this.readBuffer(10);
	}
	readBuffer(m) {
		const buffer = Buffer.allocUnsafe(this.ctx.blockSize * m);

		const n = readSync(this.fd, buffer, 0, buffer.byteLength, this.offset);
		this.offset += buffer.byteLength;
		console.log(n, "read");

		this.output = Buffer.concat([this.output, buffer]);
	}

	pullFrame(): Buffer {
		if (this.output.byteLength < this.ctx.blockSize * 5) {
			this.readBuffer(10);
		}
		const ret = this.output.slice(0, this.ctx.blockSize);
		this.output = this.output.slice(this.ctx.blockSize);
		return ret;
	}
	connect(dest: SSRContext) {
		dest.inputs.push(this);
		return true;
	}
}

///#endregion
/**
 *  440 / this.fps
 *
 */
