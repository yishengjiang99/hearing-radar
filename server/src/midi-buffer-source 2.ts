import {
  appendFileSync,
  createWriteStream,
  readFileSync,
  writeFile,
  writeFileSync,
} from "fs";
import { BufferSource } from "./audio-data-source";
import { cspawnToBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { CacheStore } from "./flat-cache-store";
import { resolve, basename } from "path";
import { Midi } from "@tonejs/midi";
import { MidiNote } from ".";
import { exec, execSync } from "child_process";

/**
 * clarinet,67,0.28301699999999996,,256,116
 */

export const parseMidiCSV = (line: string): MidiNote => {
  const [instrument, note, duration, start, end] = line.split(",");
  return {
    instrument,
    midi: parseInt(note),
    duration: parseFloat(duration),
    startTime: parseFloat(start),
    endTime: parseFloat(end),
  };
};

export const loadBuffer = async (
  ctx: SSRContext,
  note: MidiNote,
  noteCache: CacheStore
) => {
  try {
    const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
    const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
    const input = `db/Fatboy_${note.instrument}/${note.midi}.mp3`;
    const cacheKey = `${note.instrument}${note.midi}`;

    if (
      noteCache.cacheKeys.includes(cacheKey) &&
      noteCache.read(cacheKey) !== null
    ) {
      return noteCache.read(cacheKey);
    }
    const ob = Buffer.alloc(ctx.bytesPerSecond * note.duration);
    const cmd = `-hide_banner -loglevel error -t ${note.duration} -i ${input} -f ${format} ${aoptions} pipe:1`;
    await cspawnToBuffer("ffmpeg", cmd, ob);
    noteCache.set(cacheKey, ob);
    return ob;
  } catch (e) {
    console.error(e);
  } finally {
  }
};

export const playCSVmidi = async (
  ctx: SSRContext,
  notes: MidiNote[],
  cacheFileName: string
) => {
  const uniqs = new Set<string>();
  const uniqNotes = notes.map((n) => uniqs.add(n.instrument + n.midi));
  const noteCache = new CacheStore(
    uniqNotes.length,
    ctx.bytesPerSecond * 2,
    cacheFileName
  );

  for await (const brs of (async function* () {
    while (notes.length) {
      const note = notes.shift();
      await loadBuffer(ctx, note, noteCache);
      const brs = new BufferSource(ctx, {
        start: note.start - 40,
        end: note.end - 40,
        getBuffer: () => noteCache.read(`${note.instrument}${note.midi}`),
      });
      brs.connect(ctx);
      yield brs;
    }
  })());
  noteCache.persist();
};
//`db/Fatboy_${note.instrument}/${note.midi}.mp3`
export const writeToCsv = (filename) => {
  const wfs = resolve(__dirname, "../csv/", basename(filename) + ".csv");

  const { header, tracks } = new Midi(readFileSync(filename).buffer);
  writeFileSync(wfs, header.name);
  appendFileSync(wfs, "\n#inst,midi,duration,statt,end");

  tracks.map((t, i) => {
    if (!t.notes.length) return;
    const mp3list = resolve(__dirname, `../${basename(filename)}${i}.txt`);
    writeFileSync(mp3list, "ffconcat version 1.0");
    appendFileSync(
      mp3list,
      `\nfile '${resolve("../nullsrc.mp3")}'\nduration ` +
        header.ticksToSeconds(t.notes[0].ticks) +
        "\n\n"
    );
    t.notes.map((note) => {
      const obj = {
        instrument: t.instrument.name
          .replace(" ", "_")
          .replace(" ", "_")
          .replace(" ", "_")
          .replace("(", "")
          .replace(")", ""),
        note: note.midi,
        noteName: note.name,
        start: note.ticks / header.ppq,
        duration: note.durationTicks,
      };
      const fn = resolve(
        __dirname,
        `../db/Fatboy_${obj.instrument}/${note.midi - 21}.mp3`
      );
      appendFileSync(wfs, "\n" + Object.values(obj).join(","));
      appendFileSync(
        mp3list,
        [
          ``,
          `file ${fn}`,
          `duration ${header.ticksToSeconds(note.durationTicks)}`,
        ].join("\n")
      );
    });
    console.log(
      `ffmpeg -f concat -safe 0 -i ${mp3list} -f mpegts - |ffplay -i pipe:0 >> /dev/null 2>&1 &`
    );
  });
  return filename + ".csv";
};

export async function playCsv(ctx: SSRContext, csv: string, outfile: string) {
  const uniqNotes = parseInt(
    require("child_process")
      .execSync(`cat ${csv} |cut -f1,2 -d',' |sort|uniq|wc -l`)
      .toString()
      .trim()
  );
  const noteCache = new CacheStore(
    uniqNotes,
    ctx.bytesPerSecond * 2,
    resolve(`db/cache/${basename(csv)}`)
  );
  let notes = readFileSync(csv)
    .toString()
    .trim()
    .split("\n")
    .map((line) => parseMidiCSV(line));

  for await (const brs of (async function* () {
    while (notes.length && notes[0].startTime - ctx.currentTime < 4) {
      const note = notes.shift();
      const brs = new BufferSource(ctx, {
        start: note.startTime,
        end: note.endTime,
        getBuffer: () => noteCache.read(`${note.instrument}${note.midi}`),
      });
      await loadBuffer(ctx, note, noteCache);
      yield brs;
    }
  })()) {
    if (notes[0].startTime - ctx.currentTime > 4)
      await new Promise((resolve) => {
        ctx.once("tick", resolve);
      });
  }
  noteCache.persist();
  const fs = createWriteStream(outfile);
  ctx.connect(fs);
  ctx.on("data", (d) => {
    fs.write(d);
  });
  ctx.emit("data", Buffer.from(ctx.WAVHeader));
  ctx.on("tick", () => {
    console.log(ctx.currentTime);
  });
  ctx.start();
  return ctx;
}
writeToCsv(process.argv[2]);
// // playCsv(SSRContext.default, "piano.csv", "piano.wav");
// `ffmpeg -f concat -safe 0 -i ${filename} -f mpegts - |ffplay -i pipe:0`;
