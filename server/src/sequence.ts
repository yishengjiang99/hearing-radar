import { Midi, Track, Header } from "@tonejs/midi";
import { Note } from "@tonejs/midi/dist/Note";
import { exec, spawn } from "child_process";
import { CombinedNotes, MidiNote } from "src";
import { Readable, Transform, Writable } from "stream";
import { combineNotes } from "./combine-notes";
import { combinemp3 } from "./ffmpeg-link";
function sigfig(num, sigdig) {
  const mask = 10 << sigdig;

  return Math.floor(num * mask) / mask;
}
const sleep = async (ms) =>
  await new Promise((resolve) => setTimeout(resolve, ms));

export async function convertMidi(
  filename: string,
  interrupt: Readable,
  outout: Writable
) {
  let ticks = 0;
  const { tracks, header } = new Midi(require("fs").readFileSync(filename));
  let paused = false,
    stop = false;
  let interruptMsg = [];
  interrupt.on("data", (d) => {
    const msg = d.toString().trim().split(" ");
    switch (msg[0]) {
      case "p":
        paused = true;
        outout.write("\npaused");
        break;
      case "r":
        paused = false;
        outout.write("\n resume");
        stop = false;
        break;
      case "stop":
        stop = true;
        outout.write("\nstopped");
        break;
    }
  });

  const counterIterator = (async function* midiTrackGenerator(tracks, header) {
    const ppq = header.ppq;
    const tempos = header.tempos;
    let bpm = tempos[0].bpm;
    let resolution = 4;
    let intervals = 60000 / bpm / resolution;
    let msPerTick = 60000 / bpm / ppq;
    while (true) {
      const measure = header.ticksToMeasures(ticks);

      let group: CombinedNotes = {
        start: header.ticksToSeconds(ticks),
        measure: measure,
        midis: [],
      };
      for (const track of tracks) {
        if (track.notes.length === 0) continue;
        while (track.notes[0].ticks <= ticks) {
          const n: Note = track.notes.shift();
          group.midis.push({
            duration: n.duration,
            start: n.ticks,
            midi: n.midi,
            instrument: track.instrument.name
              .replace(" ", "_")
              .replace(" ", "_"),
            measure: measure,
          });
        }
      }
      yield group;

      ticks += ppq / 4;
      if (tempos[0].ticks < ticks) {
        tempos.shift();
        bpm = tempos[0].bpm;
        resolution = 4;
        intervals = 60000 / bpm / resolution;
        //yield ["tempo change", bpm, resolution, intervals];
      }
      await sleep(intervals * 0.97);
    }
  })(tracks, header);

  while (!stop) {
    if (paused) {
      await sleep(10);
      continue;
    }
    const { value, done } = await counterIterator.next();
    if (done || !value) break;
    process.stderr.write(value.measure + "\n");
    if (value.midis && value.midis.length) {
      //   value.midis.map((m) => Object.values(m).join(",")).join("\n");

      outout.write(JSON.stringify(value));
    } else {
      // outout.write(value.midis);
    }
  }
}
