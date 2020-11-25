"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferSource = exports.FileSource = exports.Oscillator = void 0;
const fs_1 = require("fs");
const stream_1 = require("stream");
const events_1 = require("events");
class Oscillator {
    constructor(ctx, { frequency, }) {
        this.active = true;
        this._ended = false;
        this.ctx = ctx;
        this.frequency = frequency;
        this.bytesPerSample = this.ctx.sampleArray.BYTES_PER_ELEMENT;
        this.connect(ctx);
    }
    get header() {
        return Buffer.from(this.ctx.WAVHeader);
    }
    pullFrame() {
        if (!this.active)
            return Buffer.alloc(0);
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
    connect(dest) {
        dest.inputs.push(this);
        return true;
    }
    ended() {
        return this._ended;
    }
}
exports.Oscillator = Oscillator;
class FileSource extends events_1.EventEmitter {
    constructor(ctx, { filePath, }) {
        super();
        this.active = true;
        this._ended = false;
        this.fd = fs_1.openSync(filePath, "r");
        this.size = fs_1.statSync(filePath).size;
        this.ctx = ctx;
        this.offset = 0;
    }
    pullFrame() {
        const ob = Buffer.allocUnsafe(this.ctx.blockSize);
        fs_1.readSync(this.fd, ob, 0, ob.byteLength, this.offset);
        this.offset += ob.byteLength;
        if (this.offset > this.size) {
            this._ended = true;
            this.stop();
        }
        return ob;
    }
    connect(dest) {
        dest.inputs.push(this);
        return true;
    }
    stop() {
        fs_1.closeSync(this.fd);
    }
    ended() {
        return this._ended;
    }
}
exports.FileSource = FileSource;
class BufferSource extends stream_1.Readable {
    constructor(ctx, props) {
        super();
        this.ctx = ctx;
        this.buffer = props.buffer;
        const { getBuffer, start, end } = props;
        this._start = start;
        this._end = end;
        this._getBuffer = getBuffer;
        console.log(start, end);
    }
    prepare() { }
    start(when) {
        this._start = when || this.ctx.currentTime;
    }
    stop(when) {
        this._end = when || this.ctx.currentTime;
    }
    get active() {
        return this.ctx.currentTime <= this._end && this.ctx.currentTime >= this._start;
    }
    pullFrame() {
        if (!this.active)
            return Buffer.alloc(0);
        if (!this.buffer)
            this.buffer = this._getBuffer();
        const ret = this.buffer.slice(0, this.ctx.blockSize);
        this.buffer = this.buffer.slice(this.ctx.blockSize);
        return ret;
    }
    connect(dest) {
        dest.inputs.push(this);
        return true;
    }
    ended() {
        return this.ctx.currentTime > this._end;
    }
    dealloc() { }
}
exports.BufferSource = BufferSource;
//# sourceMappingURL=audio-data-source.js.map