import { SSRContext } from "./ssrctx";
import {
  openSync,
  readSync,
  read,
  createReadStream,
  closeSync,
  stat,
  statSync,
} from "fs";
import { Readable } from "stream";
import { EventEmitter } from "events";
import { start } from "repl";

export interface AudioDataSource {
  ctx: SSRContext;
  active: boolean;
  // new (ctx: SSRContext, opts: any): AudioDataSource;
  pullFrame: () => Buffer;
  connect: (destination: SSRContext) => boolean;
  start: (when?: number) => void;
  stop: (when?: number) => void;
  prepare?: (currentTime: number) => void;
  ended: () => boolean;
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
  _ended: boolean = false;
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
    const cyclePerSample = (3.14 * 2 * this.frequency) / this.ctx.sampleRate;
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
    this._ended = true;
    this.active = false;
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  ended() {
    return this._ended;
  }
}

export class FileSource extends Readable implements ScheduledDataSource {
  offset: number;
  fd: number;
  ctx: SSRContext;
  active: boolean = true;
  output: Buffer;
  wptr: number;
  _ended: boolean = false;
  size: number;

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
    this.size = statSync(filePath).size;
    this.ctx = ctx;
    this.offset = 0;
  }
  start: (when?: number) => void;
  prepare?: (currentTime: number) => void = () => {};

  pullFrame(): Buffer {
    const ob = Buffer.allocUnsafe(this.ctx.blockSize);
    readSync(this.fd, ob, 0, ob.byteLength, this.offset);
    this.offset += ob.byteLength;
    if (this.offset > this.size) {
      this._ended = true;
      this.stop();
    }
    return ob;
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  stop() {
    closeSync(this.fd);
  }
  ended() {
    return this._ended;
  }
}

export type BufferSourceProps = {
  buffer?: Buffer;
  getBuffer?: () => Buffer;
  start: number;
  end: number;
};
export class BufferSource extends Readable implements ScheduledDataSource {
  _start: number;
  _end: number;
  _getBuffer: () => Buffer;
  ctx: SSRContext;
  buffer: Buffer;

  constructor(ctx: SSRContext, props: BufferSourceProps) {
    super();
    this.ctx = ctx;
    this.buffer = props.buffer;
    const { getBuffer, start, end } = props;
    this._start = start;
    this._end = end;
    this._getBuffer = getBuffer;
    console.log(start, end);
  }
  prepare() {}
  start(when?: number) {
    this._start = when || this.ctx.currentTime;
  }
  stop(when?: number) {
    this._end = when || this.ctx.currentTime;
  }

  get active(): boolean {
    return (
      this.ctx.currentTime <= this._end && this.ctx.currentTime >= this._start
    );
  }
  pullFrame(): Buffer {
    if (!this.active) return Buffer.alloc(0);
    if (!this.buffer) this.buffer = this._getBuffer();
    const ret = this.buffer.slice(0, this.ctx.blockSize);
    this.buffer = this.buffer.slice(this.ctx.blockSize);
    return ret;
  }
  connect(dest: SSRContext) {
    dest.inputs.push(this);
    return true;
  }
  ended() {
    return this.ctx.currentTime > this._end;
  }
  dealloc() {}
}
