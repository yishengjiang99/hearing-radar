import { SSRContext } from "./ssrctx";
import { openSync, readSync, read, createReadStream, closeSync } from "fs";
import { Readable } from "stream";
import { EventEmitter } from "events";
import { start } from "repl";

export interface AudioDataSource {
	ctx: SSRContext;
	active: boolean;
	// new (ctx: SSRContext, opts: any): AudioDataSource;
	pullFrame: () => Buffer | false;
	connect: (destination: SSRContext) => boolean;
	stop: () => void;
}
export interface ScheduledDataSource extends AudioDataSource {
	start: (when?: number) => void;
	stop: (when?: number) => void;
}

export class Oscillator implements AudioDataSource {
	ctx: SSRContext;
	frequency: any;
	active: boolean = true;
	bytesPerSample: number;

	constructor(
		ctx: SSRContext,
		{
			frequency,
		}: {
			frequency: number;
		}
	) {
		this.ctx = ctx;
		this.frequency = frequency;
		this.bytesPerSample = this.ctx.sampleArray.BYTES_PER_ELEMENT;
		this.connect(ctx);
	}
	get header(): Buffer {
		return Buffer.from(this.ctx.WAVHeader);
	}
	pullFrame(): Buffer {
		if (!this.active) return Buffer.alloc(0);
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
	start() {
		this.active = true;
	}
	stop() {
		this.active = false;
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
	wptr: number;

	constructor(
		ctx: SSRContext,
		{
			filePath,
		}: {
			filePath: string;
		}
	) {
		super();
		this.fd = openSync(filePath, "r");
		this.ctx = ctx;
		this.offset = 0;
	}

	pullFrame(): Buffer {
		const ob = Buffer.allocUnsafe(this.ctx.blockSize);
		readSync(this.fd, ob, 0, ob.byteLength, this.offset);
		this.offset += ob.byteLength;
		return ob;
	}
	connect(dest: SSRContext) {
		dest.inputs.push(this);
		return true;
	}
	stop() {
		closeSync(this.fd);
	}
}

export type BufferSourceProps = {
	buffer?: Buffer;
	loadBuffer?: () => Promise<Buffer>;
	start: number;
	end: number;
};
export class BufferSource extends Readable implements ScheduledDataSource {
	_start: number;
	_end: number;
	_loadBuffer: () => Promise<Buffer>;
	ctx: SSRContext;
	buffer: Buffer;
	constructor(ctx: SSRContext, props: BufferSourceProps) {
		super();
		this.ctx = ctx;
		this.buffer = props.buffer;
		const { loadBuffer, start, end } = props;
		if (start) this._start = start;
		if (end) this._end = end;
		this._loadBuffer = loadBuffer;
		this.connect(ctx);
	}
	async load() {
		if (this.buffer) return;

		if (this._loadBuffer) {
			this._loadBuffer().then((b) => (this.buffer = b));
		}
	}
	start(when?: number) {
		this._start = when || this.ctx.currentTime;
	}
	stop(when?: number) {
		this._end = when || this.ctx.currentTime;
	}

	get active(): boolean {
		return (
			this.ctx.currentTime < this._end &&
			this.ctx.currentTime > this._start
		);
	}
	pullFrame(): Buffer | false {
		if (!this.active) return false;
		const ret = this.buffer.slice(0, this.ctx.blockSize);
		this.buffer = this.buffer.slice(this.ctx.blockSize);
		console.log("pull", this.ctx.currentTime);
		return ret;
	}
	connect(dest: SSRContext) {
		dest.inputs.push(this);
		return true;
	}
	dealloc() {}
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
// export const sampleDir = (filename) =>
// 	require("path").resolve(__dirname, "../testdata", filename);
// debugger;
// const ctx = new SSRContext();
// const fd = openSync(sampleDir("440.pcm"), "r");
// const buffer = Buffer.allocUnsafe(ctx.blockSize * 350);
// readSync(fd, buffer, 0, ctx.blockSize * 350, 0);
// closeSync(fd);
// ctx.connect(process.stdout);
// ctx.start();
