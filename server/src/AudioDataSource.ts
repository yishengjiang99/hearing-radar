import { SSRContext } from "./ssrctx";

export interface AudioDataSource {
	ctx: SSRContext;
	active: boolean;
	// new (ctx: SSRContext, opts: any): AudioDataSource;
	pullFrame: () => Int16Array;
	connect: (destination: SSRContext) => boolean;
}

export class Oscillator implements AudioDataSource {
	ctx: SSRContext;
	frequency: any;
	active: boolean = true;
	constructor(ctx: SSRContext, { frequency }) {
		this.ctx = ctx;
		this.frequency = frequency;
	}
	pullFrame() {
		const frames = new Int16Array(this.ctx.blockSize);
		const n = this.ctx.frameNumber;
		const cyclePerSample =
			(3.14 * 2 * this.frequency) / this.ctx.sampleRate;
		const cyclePerFrame = (3.14 * 2 * this.frequency) / this.ctx.fps;
		const phase = this.ctx.frameNumber * cyclePerFrame;
		for (let i = 0; i < this.ctx.samplesPerFrame; i++) {
			for (let n = 0; n < this.ctx.nChannels; n++) {
				frames[i] = Math.sin(phase + cyclePerSample * i) * 255;
			}
		}
		return frames;
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
