import { Writable } from "stream";
import { AudioDataSource } from "./audio-sources/audio-data-source";
import { SSRContext } from "./ssrctx";
export class TrackAggregator extends Writable {
  ctx: SSRContext;
  active: true;
  activeSources: Set<AudioDataSource>;
  upcoming: AudioDataSource[][];
  currentFrameBuffer: Buffer;

  constructor(ctx: SSRContext) {
    super({ objectMode: true });
    this.ctx = ctx;
    this.activeSources = new Set<AudioDataSource>();
    this.upcoming = new Array(210).fill([]);
    this.currentFrameBuffer = Buffer.alloc(ctx.blockSize);
    this.ctx.on("tick", this.handleTick);
  }
  handleTick = () => {
    const newinputs = this.upcoming.shift();
    newinputs.forEach((sbr: AudioDataSource) => {
      this.activeSources.add(sbr);
      sbr.once("end", () => this.activeSources.delete(sbr));
    });
    this.upcoming.push([]);
    const l = this.ctx.blockSize;
    const g = 1 / this.activeSources.size;
    const sums = new Float64Array(l);
    for (const sbr of this.activeSources) {
      const b = sbr.read();
      for (let j in b) {
        sums[j] += b[j] * g;
      }
    }
    this.currentFrameBuffer = Buffer.from(sums);
  };

  join(srb: AudioDataSource) {
    const startFrame = srb.start;
    console.log("new join", startFrame, "currentctx ", this.ctx.frameNumber);
    if (startFrame < this.ctx.currentTime) {
      srb.start = this.ctx.currentTime;
      this.upcoming[0].push(srb);
    } else {
      this.upcoming[startFrame - this.ctx.frameNumber].push(srb);
      console.log(startFrame - this.ctx.frameNumber);
    }
  }
  _transform(srb: AudioDataSource, _, cb) {
    if (srb.start < this.ctx.currentTime) {
      srb.start = this.ctx.currentTime;
      this.upcoming[0].push(srb);
    } else {
      this.upcoming[startFrame - this.ctx._frameNumber].push(srb);
    }
    cb();
  }

  read(): Buffer {
    return this.currentFrameBuffer;
  }
  _flush(cb) {}
}
