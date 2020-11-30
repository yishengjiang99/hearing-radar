import { PassThrough, Writable } from "stream";
import { SSRContext } from "./ssrctx";
import { spawn } from "child_process";

export const ffplay = (ctx: SSRContext = new SSRContext()): Writable => {
  const { stdin, stdout, stderr } = spawn(
    "ffplay",
    `-i pipe:0 -ac ${ctx.nChannels} -ar ${ctx.sampleRate} -f ${
      ctx.bitDepth == 16 ? "s16le" : "f32le"
    }`.split(" ")
  );
  stderr.pipe(process.stderr);
  const pt = new PassThrough();
  pt.pipe(stdin);
  return pt;
};
