import { createWriteStream, readFileSync } from "fs";
import { ScheduledDataSource, BufferSource } from "./audio-data-source";
import { cspawnToBuffer, spawnInputBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { cacheStore, CacheStore } from "./flat-cache-store";
import { execSync, spawn } from "child_process";
import { notes } from "./soundkeys";
import { PassThrough } from "stream";
import { Midi, Header } from "@tonejs/midi";
import { Writable } from "stream";
type tick = number;
type MidiNote = {
  instrument: string;
  note: number;
  start: tick;
  duration: tick;
};
export const tickToTime = (t: tick) => t / 1000;
/**
 * clarinet,67,0.28301699999999996,,256,116
 */
export const parseMidiCSV = (line: string): MidiNote => {
  const [trickId, instrument, note, noteName, startTick, durationTick, start, end] = line.split(",");
  return {
    instrument: instrument.replace(" ", "_").replace(" ", "_").replace(" ", "_"),
    note: parseInt(note) - 21,
    start: parseInt(start),
    duration: parseFloat(end) - parseFloat(start),
  };
};
export const initCache = (ctx: SSRContext) => {
  const byteLength = ctx.bytesPerSecond * 2;
  return new CacheStore(221, byteLength);
};

export const loadBuffer = async (ctx: SSRContext, note: MidiNote, noteCache: CacheStore) => {
  try {
    const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
    const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
    const input = `db/Fatboy_${note.instrument}/${note.note}.mp3`;
    const cacheKey = `${note.instrument}${note.note}`;

    if (noteCache.cacheKeys.includes(cacheKey)) {
      return noteCache.read(cacheKey);
    }
    const ob = noteCache.malloc(cacheKey);
    const cmd = `-hide_banner -loglevel panic -t 2 -i ${input} -f ${format} ${aoptions} pipe:1`;
    await cspawnToBuffer("ffmpeg", cmd, ob);
    console.log(cmd);
    return ob;
  } catch (e) {
    console.error(e);
  } finally {
  }
};

export const preCacheNotes = async (ctxstr: string, midiFile: string) => {
  const ctx = SSRContext.fromFileName(ctxstr);
  const uniqNotes = parseInt(execSync(`cat ${midiFile} |cut -f1,2 -d',' |sort|uniq|wc -l`).toString().trim());
  const noteCache = new CacheStore(uniqNotes, ctx.bytesPerSecond * 2, `db/cache/${ctxstr}${midiFile}`);
  let notes = readFileSync(midiFile)
    .toString()
    .trim()
    .split("\n")
    .map((line) => parseMidiCSV(line));

  for await (const _ of (async function* () {
    while (notes.length) {
      yield await loadBuffer(ctx, notes.shift(), noteCache);
    }
  })());

  noteCache.persist();

  readFileSync(midiFile)
    .toString()
    .trim()
    .split("\n")
    .map((line) => parseMidiCSV(line))
    .map((note) => {
      const brs = new BufferSource(ctx, {
        start: tickToTime(note.start),
        end: tickToTime(note.start + note.duration),
        getBuffer: () => noteCache.read(`${note.instrument}${note.note}`),
      });
      brs.connect(ctx);
    });
  return ctx;
};

export function playCsv(ctxString: string, midiFile: string, outfile: string) {
  const {
    header: { ticksToMeasures, ticksToSeconds },
    tracks,
  } = new Midi(readFileSync(midiFile).buffer);

  preCacheNotes(ctxString, csv).then((ctx) => {
    const output = createWriteStream(outfile);
    //	output.write(Buffer.from(ctx.WAVHeader));
    ctx.connect(output);
    ctx.on("data", (d) => {
      let offset = 0;
      while (offset * 2 < d.byteLength - 2) {
        const n = d.readInt16LE(offset);
        offset++;
        process.stdout.write(n + "\n");
      }
    });
    ctx.start();
  });
}
//playCsv("s16le-ar9000-ac1-", "clarinet.csv", "clarinet.wav");
playCsv("s16le-ar9000-ac1-", "trumpet.csv", "trumpet.wav");
export async function* midiTrackGenerator(tracks: any[]) {
  let now = 0;

  while (tracks.length > 0) {
    let next = null;
    let loopdone;
    for (const index in tracks) {
      const track = tracks[index];
      if (track.length === 0) {
        loopdone = index;
        continue;
      }
      if (track[0] && track[0].ticks && track[0].ticks < now) {
        const { instrument, midi, name, ticks, durationTicks } = track.shift();
        yield [instrument.name, midi, name, ticks, durationTicks];
      } else {
      }
    }
    if (loopdone) tracks.splice(loopdone, 1);
    now += 10;
  }
}
