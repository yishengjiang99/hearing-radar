import { appendFileSync, createWriteStream, readFileSync, writeFile, writeFileSync } from "fs";
import { ScheduledDataSource, BufferSource } from "./audio-data-source";
import { cspawnToBuffer, spawnInputBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { cacheStore, CacheStore } from "./flat-cache-store";
import { resolve, basename } from "path";
import { Midi } from "@tonejs/midi";
import { MidiNote } from ".";

/**
 * clarinet,67,0.28301699999999996,,256,116
 */

export const parseMidiCSV = (line: string): MidiNote => {
  const [instrument, note, duration, start, end] = line.split(",");
  return {
    instrument,
    note: parseInt(note),
    duration: parseFloat(duration),
    start: parseFloat(start),
    end: parseFloat(end),
  };
};

export const loadBuffer = async (ctx: SSRContext, note: MidiNote, noteCache: CacheStore) => {
  try {
    const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
    const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
    const input = `db/Fatboy_${note.instrument}/${note.note}.mp3`;
    const cacheKey = `${note.instrument}${note.note}`;

    if (noteCache.cacheKeys.includes(cacheKey) && noteCache.read(cacheKey) !== null) {
      return noteCache.read(cacheKey);
    }
    const ob = noteCache.malloc(cacheKey);
    const cmd = `-hide_banner -loglevel panic -t 2 -i ${input} -f ${format} ${aoptions} pipe:1`;
    await cspawnToBuffer("ffmpeg", cmd, ob);
    return ob;
  } catch (e) {
    console.error(e);
  } finally {
  }
};

export const playCSVmidi = async (ctx: SSRContext, notes: MidiNote[], cacheFileName: string) => {
  const uniqs = new Set<string>();
  const uniqNotes = notes.map((n) => uniqs.add(n.instrument + n.note));
  const noteCache = new CacheStore(uniqNotes.length, ctx.bytesPerSecond * 2, cacheFileName);

  for await (const brs of (async function* () {
    while (notes.length) {
      const note = notes.shift();
      await loadBuffer(ctx, note, noteCache);
      const brs = new BufferSource(ctx, {
        start: note.start - 40,
        end: note.end - 40,
        getBuffer: () => noteCache.read(`${note.instrument}${note.note}`),
      });
      brs.connect(ctx);
      yield brs;
    }
  })()) {
    // console.log("adding ", brs);
  }
  noteCache.persist();
};

const filename = "../Beethoven-Symphony5-1.mid";

const writeToCsv = (filename) => {
  const wfs = resolve(__dirname, "../csv/", basename(filename) + ".csv");

  const { header, tracks } = new Midi(readFileSync(resolve(__dirname, filename)).buffer);
  writeFileSync(wfs, header.name);
  appendFileSync(wfs, "\n#inst,midi,duration,statt,end");
  tracks.map((t) => {
    t.notes.map((note) => {
      const obj = {
        instrument: t.instrument.name.replace(" ", "_").replace(" ", "_").replace(" ", "_").replace("(", "").replace(")", ""),
        note: note.midi,
        duration: header.ticksToSeconds(note.durationTicks),
        start: header.ticksToSeconds(note.ticks),
        end: header.ticksToSeconds(note.ticks) + header.ticksToSeconds(note.durationTicks),
      };
      appendFileSync(wfs, "\n" + Object.values(obj).join(","));
      console.log(obj);
    });
  });
  return filename + ".csv";
};
const ctx = SSRContext.fromFileName("-ac1-s16le");

//  playCSVmidi(ctx, notes, t.instrument.name);

// playCSVmidi(ctx, resolve(__dirname, "../csv/mid2.csv"));

// ctx.connect(createWriteStream("mid2.wav"));
// ctx.start();

export async function playCsv(ctx: SSRContext, csv: string, outfile: string) {
  const uniqNotes = parseInt(require("child_process").execSync(`cat ${csv} |cut -f1,2 -d',' |sort|uniq|wc -l`).toString().trim());
  const noteCache = new CacheStore(uniqNotes, ctx.bytesPerSecond * 2, resolve(`db/cache/${basename(csv)}`));
  let notes = readFileSync(csv)
    .toString()
    .trim()
    .split("\n")
    .map((line) => parseMidiCSV(line));

  for await (const brs of (async function* () {
    while (notes.length) {
      const note = notes.shift();

      const brs = new BufferSource(ctx, {
        start: note.start,
        end: note.end,
        getBuffer: () => noteCache.read(`${note.instrument}${note.note}`),
      });
      await loadBuffer(ctx, note, noteCache);
      yield brs;
    }
  })()) {
    ctx.inputs.push(brs);
  }
  noteCache.persist();
  const fs = createWriteStream(outfile);
  ctx.connect(createWriteStream(outfile));
  ctx.prepareUpcoming();
  ctx.on("data", (d) => {
    console.log(".");
    fs.write(d);
  });
  ctx.start();
  return ctx;
}
//writeToCsv("../Beethoven-Symphony5-1.mid");
playCsv(ctx, "./csv/sorted.csv", "midi.wav");
