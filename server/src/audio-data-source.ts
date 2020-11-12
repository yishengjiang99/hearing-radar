import { SSRContext } from "./ssrctx";
import { openSync, readSync, read, createReadStream } from "fs";
import { Readable } from "stream";
import { EventEmitter } from "events";

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
		if (this.ctx.frameNumber === 0) {
			return Buffer.from(this.ctx.WAVHeader);
		}
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
	rs: import("fs").ReadStream;

	constructor(ctx: SSRContext, { filePath }) {
		super();
		this.fd = openSync(filePath, "r");
		this.ctx = ctx;
		this.offset = 0;
		this.output = Buffer.alloc(this.ctx.blockSize);

		this.rs = createReadStream(filePath);
		readSync(this.fd, this.output, 0, this.ctx.blockSize, this.offset);
		this.offset += this.ctx.blockSize;
	}

	pullFrame(): Buffer {
		const ob = Buffer.alloc(this.ctx.blockSize);
		read(this.fd, ob, 0, ob.byteLength, this.offset, () => {
			this.output = ob;
		});
		return this.output;
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
// let o = new Oscillator(SSRContext.fromFileName("f32le-ac2"), {
// 	frequency: 440,
// });
// const b = o.pullFrame();
// console.log(b);
//console.log(o.pullFrame());
