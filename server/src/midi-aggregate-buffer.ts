import { TimeFrame } from "./";
import { Transform } from "stream";
import {
  AudioDataSource,
  BaseAudioSource,
  BufferSource,
} from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { Ticker } from "./ticker";
export class AgggregateScheduledBuffer extends Transform {
  ctx: SSRContext;
  active: true;
  activeSources: Set<BufferSource>;
  upcoming: BufferSource[][];
  currentFrameBuffer: [TimeFrame, number, Buffer];
  ctxFrame: TimeFrame;
  _ticker: Ticker;

  constructor(ctx: SSRContext) {
    super({ objectMode: true });
    this.ctx = ctx;
    this.activeSources = new Set<BufferSource>();
    this.upcoming = new Array(200).fill([]);
    this.currentFrameBuffer = [
      ctx._frameNumber,
      0,
      Buffer.alloc(ctx.blockSize),
    ];
    this.ctx.on("tick", this.handleTick);
  }

  handleTick = (frameNumber: TimeFrame) => {
    this.ctxFrame = frameNumber;
    const newinputs = this.upcoming.shift();
    newinputs.forEach((sbr: BufferSource) => {
      this.activeSources.add(sbr);
      // sbr.once("end", () => this.activeSources.delete(sbr));
    });
    this.upcoming.push([]);

    const l = this.ctx.blockSize;
    const g = 1 / this.activeSources.size;
    const sums = new this.ctx.sampleArray(l).fill(0);
    this.activeSources.forEach((sbr) => {
      if (!sbr.buffer && !sbr._getBuffer) {
        process.exit();
      }
      const b = sbr.pullFrame();
      for (let j in b) {
        sums[j] += b[j] * g;
      }
    });
    this.currentFrameBuffer = [
      frameNumber,
      this.activeSources.size,
      Buffer.from(sums),
    ];
  };

  join(srb: BaseAudioSource) {
    const startFrame = srb._start / this.ctx.secondsPerFrame;
    if (startFrame < this.ctx._frameNumber) {
      srb._start = this.ctx.currentTime;
      this.upcoming[0].push(srb);
    } else {
      const framesDiff = Math.floor(startFrame - this.ctx.frameNumber);

      this.upcoming[framesDiff].push(srb);
    }
  }
  _transform(srb: BufferSource, _, cb) {
    if (!srb.buffer)
      cb(new Error("no buffer in aggre schedule transform " + srb.toString()));
    else {
      this.join(srb);
      cb();
    }
  }

  pullFrame(): Buffer {
    return this.currentFrameBuffer[2];
  }
  _flush(cb) {}
}
