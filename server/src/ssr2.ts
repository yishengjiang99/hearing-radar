import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { Duplex, PassThrough, Readable, Writable } from "stream";
import { AudioDataSource, FileSource } from "./audio-data-source";
import { wavHeader, readHeader } from "./wav-header";

import { Decoder, Encoder } from "./kodak";
import { Ffmpegd } from "./ffmpegd";
import { AgggregateScheduledBuffer } from "./midi-aggregate-buffer";
import { TimeFrame } from ".";
import { Ticker } from "./ticker";
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
const defaultProps: CtxProps = {
  nChannels: 2,
  sampleRate: 44100,
  bitDepth: 16,
};
export class SSRContext extends Readable {
  encoder: Encoder;
  nChannels: number;
  sampleRate: number;
  fps: number;
  _frameNumber: TimeFrame;
  aggregate: AgggregateScheduledBuffer;
  bitDepth: number;
  pt: PassThrough;
  endFrame: number;

  static fromFileName = (filename: string): SSRContext => {
    const nChannels = filename.match(/\-ac(\d+)\-/)
      ? parseInt(filename.match(/\-ac(\d+)\-/)[1])
      : 2;
    const sampleRate =
      (filename.match(/\-ar(\d+)\-/) &&
        parseInt(filename.match(/\-ar(\d+)\-/)[1])) ||
      44100;
    const bitDepth = filename.includes("f32le") ? 32 : 16;
    return new SSRContext({
      sampleRate: sampleRate,
      nChannels: nChannels,
      fps: sampleRate / 128,
      bitDepth,
    });
  };

  static default: SSRContext = new SSRContext(defaultProps);
  timeFrame: number;
  constructor(props: CtxProps = defaultProps) {
    super();
    const { nChannels, sampleRate, fps, bitDepth } = {
      ...defaultProps,
      ...props,
    };
    this.nChannels = nChannels;
    this.sampleRate = sampleRate;
    this.fps = sampleRate / 128;
    this._frameNumber = 0;
    this.bitDepth = bitDepth;
    this.encoder = new Encoder(this.bitDepth);
  }
  get samplesPerFrame() {
    return (this.sampleRate * this.nChannels) / this.fps;
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
  get secondsPerFrame() {
    return 1 / this.fps;
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
  incFrameNumber() {
    this._frameNumber += 1;
  }
  get frameNumber() {
    return this._frameNumber;
  }
  pump(): boolean {
    const [frameN, nInputs, data] = this.aggregate.currentFrameBuffer;
    if (frameN === this._frameNumber) this.emit("data", data);
    else {
      console.log("mismatch");
    }
    return;
  }
  get blockSize() {
    return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
  }
  get currentTime() {
    return this._frameNumber * this.secondsPerFrame;
  }
  get bytesPerSecond() {
    return (
      this.sampleRate * this.nChannels * this.sampleArray.BYTES_PER_ELEMENT
    );
  }
  connect(destination: Writable) {
    this.pipe(destination);
  }
  start = () => {
    let that = this;
    let pushResult = [0, 0];
    // this.emit("data", Buffer.from(this.WAVHeader));
    // const ticker = new Ticker();
    const t = setInterval(() => {
      if (that.endFrame <= that.frameNumber) {
        that.emit("end");

        clearTimeout(t);
      }
      const pushOK = that.pump();
      pushOK ? pushResult[0]++ : pushResult[0]++;
      that.incFrameNumber();
      that.emit("tick", that.frameNumber);
    }, this.secondsPerFrame);
  };
  get format() {
    return this.bitDepth === 16 ? "s16le" : "f32le";
  }
  stop(seconds: number = 0, cb?: CallableFunction) {
    if (!seconds) {
      this.endFrame = this._frameNumber;
    } else {
      this.endFrame = this._frameNumber + seconds / this.secondsPerFrame;
      console.log("setting endframe to ", this.endFrame);
    }
  }
  _read(size: number) {
    // console.trace("_read called " + size);
  }
}

// ctx.inputs.push(new FileSource(ctx, { filePath: "midi.wav" }));
// ctx.pipe(process.stdout);
// ctx.start();
