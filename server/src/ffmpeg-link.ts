import { spawn, execSync, ChildProcess } from "child_process";
import { PassThrough, Writable } from "stream";
import { Buffer } from "buffer";
import { unlinkSync } from "fs";
import { resolve } from "path";
import { CacheStore } from "./flat-cache-store";
import { MidiNote } from ".";
export type CastFunction = () => Writable;
export const pcm_note_size = 76216696 / 88;
export const castInput: CastFunction = () => {
  unlinkSync("input2");
  execSync("mkfifo input2");
  const pt = new PassThrough();
  const ff = spawn(
    "ffmpeg",
    `-debug-level=trace -i pipe:0 -re -f mulaw -f rtp rtp://127.0.0.1:1234`.split(
      " "
    )
  );
  pt.pipe(ff.stdin);

  ff.on("error", console.error);
  return pt;
};

export const cspawnToBuffer = async (cmd: string, str: string, ob: Buffer) => {
  await new Promise((resolve, reject) => {
    if (!ob) ob = Buffer.alloc(1024 * 20);
    const { stdout, stderr } = spawn(cmd, str.split(" "));
    let offset = 0;
    stdout.on("data", (chunk) => {
      if (offset + chunk.byteLength > ob.byteLength) {
        console.trace();
        console.log(offset, chunk.byteLength, ob.byteLength);
        let tmp = Buffer.alloc(ob.byteLength + 1024 * 20);
        tmp.set(ob, 0);
        ob = tmp;
      }
      ob.set(chunk, offset);
      offset += chunk.byteLength;
    });
    stdout.on("error", reject);
    stderr.pipe(process.stderr);
    stdout.on("end", resolve);
  });
};
export function ffmpegToBuffer(args: string, ob: Buffer) {
  cspawnToBuffer(`ffmpeg`, args, ob);
}

export const mp3db = (inst: string, midi: number) =>
  resolve(__dirname, "../db/", inst, `${midi}.mp3`);

export type CombinedNotes = {
  midis: MidiNote[];
  buffer?: Buffer;
  start?: number;
};
export const combinemp3 = async (
  combinedNote: CombinedNotes,
  duration: number,
  format: string = "s16le",
  aoptions: string = "-ac 2 -ar 44100"
): Promise<Buffer | undefined> => {
  const inputStr = combinedNote.midis
    .map((note) => `-i db/${note.instrument}/${note.midi - 21}.mp3`)
    .join(" ");
  const filterStr = `-filter_complex amix=inputs=${combinedNote.midis.length}`;
  const cmd = `-y -hide_banner -loglevel panic ${inputStr} ${filterStr} -t ${duration} -f ${format} ${aoptions} pipe:1 -`;
  await cspawnToBuffer("ffmpeg", cmd, combinedNote.buffer);

  return combinedNote.buffer;
};

export const spawnInputBuffer = (proc: ChildProcess, buffer?: Buffer) => {
  proc.on("error", console.error);
  const pt = new PassThrough();
  pt.pipe(proc.stdin);
  pt.write(buffer);
};
