import { EventEmitter } from "events";
import { createWriteStream } from "fs";
import { PassThrough, Writable } from "stream";
import { AudioDataSource } from "./audio-sources/audio-data-source";
import { Decoder, Encoder } from "./Encoder";
import { readHeader, wavHeader } from "./wav-header";

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
  lastFrame: number;
  output: Writable;
  frameNumber: number;
  bitDepth: number;
  static fromWAVFile = (path: string): SSRContext => {
    return readHeader(path);
  };
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
      fps: sampleRate / 128 / 50,
      bitDepth,
    });
  };
  static default(): SSRContext {
    return new SSRContext(SSRContext.defaultProps);
  }
  static defaultProps: CtxProps = {
    nChannels: 2,
    sampleRate: 44100,
    bitDepth: 16,
  };
  end: number;
  decoder: Decoder;
  inputs: AudioDataSource[] = [];

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
    this.decoder = new Decoder(this.bitDepth);
    this.playing = true;
  }
  get secondsPerFrame() {
    return 1 / this.fps;
  }
  get samplesPerFrame() {
    return 128;
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
    this.frameNumber++;
    for (let i = 0; i < this.inputs.length; i++) {
      const b = this.inputs[i].read();
      b && this.emit("data", b);
      if (this.output) this.output.write(b);
    }
    return ok;
  }
  prepareUpcoming() {
    let newInputs = [];
    const t = this.currentTime;
    for (let i = 0; i < this.inputs.length; i++) {}
    this.inputs = newInputs;
    if (this.inputs.length === 0) {
      this.stop(0);
    }
  }
  get blockSize() {
    return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
  }
  get currentTime() {
    return this.frameNumber * this.secondsPerFrame;
  }
  get bytesPerSecond() {
    return (
      this.sampleRate * this.nChannels * this.sampleArray.BYTES_PER_ELEMENT
    );
  }
  connect(destination: Writable) {
    this.output = destination;
  }
  start = () => {
    this.playing = true;
    if (this.output === null) return;
    let that = this;
    this.emit("data", Buffer.from(this.WAVHeader));
    let timer = setInterval(() => {
      that.pump();
      if (!that.playing || (that.end && that.currentTime >= that.end)) {
        that.stop(0);
        clearInterval(timer);
      }

      this.prepareUpcoming();
    }, this.secondsPerFrame);
  };
  getRms() {}

  stop(second?: number) {
    if (second === 0) {
      this.playing = false;
      this.emit("finish");
    } else {
      this.end = second;
    }
  }
  run() {
    while (true) {
      this.pump();
    }
  }
}
// const ctx = SSRContext.fromFileName("-ac1-s16le");
// playCSVmidi(ctx, resolve(__dirname, "../csv/midi.csv"));

// ctx.connect(createWriteStream("mid2.wav"));
// ctx.start();
