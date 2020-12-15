import { expect } from "chai";
import { SSRContext } from "./ssrctx";
import { Oscillator } from "./audio-sources/Oscillator";
import { Readable } from "stream";
import { write } from "src/Encoder";
const ctx = SSRContext.default();
const osc = new Oscillator(ctx, { frequency: 440 });
console.log(osc.start, osc.end, osc.isActive());
console.log(ctx.inputs);

ctx.connect(require("fs").createWriteStream("2.wav"));
ctx.start();

setTimeout(() => {
  ctx.stop();
}, 5);
//ctx.start();
