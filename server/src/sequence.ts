import { Midi, Track, Header } from "@tonejs/midi";
import { readFileSync, writeSync, openSync, readSync } from "fs";
import { Readable, Transform, Writable } from "stream";
import { CacheStore } from "./flat-cache-store";
import { format, SSRContext, sleep } from "./ssrctx";

export async function convertMidi(
  source,
  output,
  props: {
    mode: "manual" | "realtime" | "asap";
    interrupt: Readable;
    realtime: boolean;
  }
) {
  const ctx = new SSRContext({
    nChannels: 1,
    bitDepth: 32,
    sampleRate: 48000,
  });
  const noteCache = new CacheStore(200, ctx.bytesPerSecond / 2, "223");

  const { interrupt, realtime } = props;
  interrupt.on("data", handleMessage);

  const { tracks, header } = new Midi(require("fs").readFileSync(source));
  const state = {
    paused: false,
    time: 0,
    mode: "auto",
  };

  async function pullMidiTrack(tracks, cb) {
    let now = 0;
    let done = 0;
    while (tracks.length > done) {
      // console.log(now);
      const group = [];
      tracks.forEach((track, i) => {
        if (!track.notes || track.notes.length === 0) {
          done++;
          return;
        }

        while (track.notes[0].ticks <= now) {
          const note = track.notes.shift();
          group.push({
            ...note,
            trackId: i,
            duration: header.ticksToSeconds(note.durationTicks),
            start: header.ticksToSeconds(note.ticks + note.durationTicks),
            instrument: format(track.instrument.name),
          });
        }
      });
      const { abort, increment } = await cb(now, group);
      if (abort) break;
      now += increment;
    }
  }

  async function callback(
    now,
    notes
  ): Promise<{ increment: number; abort: boolean }> {
    function currentTempo(now) {
      if (header.tempos[1] && now >= header.tempos[1].ticks) {
        header.tempos.shift();
      }
      if (header.timeSignatures[1] && now >= header.timeSignatures[1].ticks) {
        header.timeSignatures.shift();
      }
      let ppb = header.ppq;
      let bpm = header.tempos[0]?.bpm || 120;
      let signature = header.timeSignatures[0].timeSignature;
      let beatLengthMs = 60000 / header.tempos[0].bpm;
      let ticksPerbeat = header.ppq;

      return { ppb, bpm, ticksPerbeat, signature, beatLengthMs };
    }
    const cycleStart = process.uptime();
    const { beatLengthMs, ticksPerbeat } = currentTempo(now);
    sequencer.addNew(notes, ticksPerbeat);
    sequencer.showCurrentRow();
    sequencer.playCurrentRow();
    if (state.mode === "manual") {
      await new Promise<void>((resolve) => {
        interrupt.on("data", (d) => {
          if (d.toString() === "s\n") {
            resolve();
          }
        });
      });
    } else if (realtime) {
      const timeSpentInOffCycle = process.uptime() - cycleStart;

      await sleep(beatLengthMs / 4 - timeSpentInOffCycle);
    } else {
      await new Promise((resolve) => {
        process.nextTick(resolve);
      });
    }
    return { increment: ticksPerbeat / 4, abort: false };
  }

  const sequenceArray = new Array(224).fill(new Array(80).fill(" "));
  const beatsPerRow = 1 / 4;
  let buffers = [];
  let activeTracks = {};
  let dynamicCompression = {
    threshold: 0.8,
    ratio: 10,
    attack: 0.5,
    knee: 0.9,
  };

  const sequencer = {
    sequenceArray,

    showCurrentRow: () => {
      let row = sequenceArray.shift();
      process.stdout.write("\n" + row.join(""));
      row = null;
      sequenceArray.push(new Array(80).fill(" "));
    },
    playCurrentRow: () => {
      let secondsPerRow = 60000 / header.tempos[0].bpm / beatsPerRow;
      let bytes = secondsPerRow * ctx.bytesPerSecond;
      const activeSources = Object.keys(activeTracks).length;
      const summingRow = new Float64Array(bytes * 2);

      const rowbuffers: Buffer[] = [];
      for (const trackId of Object.keys(activeTracks)) {
        rowbuffers.push(activeTracks[trackId].buffer.slice(0, bytes));
        activeTracks[trackId].buffer = activeTracks[trackId].buffer.slice(
          bytes
        );
      }
      for (let i = 0; i < bytes / 4; i += 4) {
        for (const buffer of rowbuffers) {
          summingRow[i] += buffer.readFloatLE(i);
        }
      }
      const outputbuffer = new Float32Array(summingRow.length);
      for (let i = 0; i < summingRow.length; i++) {
        let v = summingRow[i];
        let { threshold, knee, attack, ratio } = dynamicCompression;
        if (v > threshold + knee) {
          v = threshold + (v - threshold - knee) / (ratio * attack);
        } else {
          v = threshold + (v - threshold) / ratio;
        }
        outputbuffer[i] = v[i];
      }
      output.write(Buffer.from(outputbuffer));
    },
    addNew: (notes, ticksPerbeat) => {
      while (notes.length) {
        const note = notes.shift();
        note.buffer = loadBuffer(
          ctx,
          note,
          note.duration < 0.5 ? noteCache : null
        );
        activeTracks[note.trackId] = note;
        let i = 0;
        while (i < Math.ceil(note.durationTicks / ticksPerbeat) * 4) {
          sequenceArray[i][note.midi] = i;
          i++;
        }
      }
    },
  };
  function handleMessage(d) {
    const msg = d.toString().trim().split(" ");
    switch (msg[0]) {
      case "p":
        state.paused = true;
        output.write("\npaused");
        break;
      case "r":
        state.paused = false;
        output.write("\n resume");
        break;
      case "ff":
        state.paused = true;
        output.write("\nstopped");

        break;
      case "s":
        break;
      case "l":
        console.log(sequenceArray); //.map((n) => JSON.stringify(n)).join("\n"));
        break;
    }
  }

  pullMidiTrack(tracks, callback);
}

function loadBuffer(ctx: SSRContext, note, noteCache: CacheStore) {
  const input = `./midisf/${note.instrument}/48000-mono-f32le-${
    note.midi - 21
  }.pcm`;
  let ob;
  if (noteCache) {
    const cacheKey = `${note.instrument}${note.midi}`;
    if (
      noteCache &&
      noteCache.cacheKeys.includes(cacheKey) &&
      noteCache.read(cacheKey) !== null
    ) {
      console.log("cache hitt");
      return noteCache.read(cacheKey);
    }
    console.log("cache miss " + cacheKey + "cache size ");
    ob = noteCache.malloc(cacheKey);
  } else {
    ob = Buffer.alloc(ctx.bytesPerSecond * 2);
  }
  const fd = openSync(input, "r");
  readSync(fd, ob, 0, ob.byteLength, 0);
  return ob;
}
