import { Midi, Header } from "@tonejs/midi";
import { createWriteStream, readFileSync, readdirSync } from "fs";
import { Writable } from "stream";

export function loadMidi(filename, output: Writable) {
  console.log(filename, output);
  const midi = new Midi(readFileSync(filename).buffer);
  return midi.tracks.map((track) =>
    track.notes.forEach((note: any) => {
      output.write(
        [
          track.channel,
          track.instrument.name,
          note.midi,
          midi.header.ticksToSeconds(note.ticks),
          midi.header.ticksToSeconds(note.durationTicks),
          note.ticks,
          note.durationTicks,
          note.name,
        ].join(",") + "\n"
      );
    })
  );
}

// export async function* midiTrackGenerator(tracks: any[]) {
//   let now = 0;

//   while (tracks.length > 0) {
//     let next = null;
//     let loopdone;
//     for (const index in tracks) {
//       const track = tracks[index];
//       if (track.length === 0) {
//         loopdone = index;
//         continue;
//       }
//       if (track[0] && track[0].ticks && track[0].ticks < now) {
//         const { instrument, midi, name, ticks, durationTicks } = track.shift();
//         yield [instrument.name, midi, name, ticks, durationTicks];
//       } else {

//       }
//     }
//     if (loopdone) tracks.splice(loopdone, 1);
//     now += 10;
//   }
// }
const n = readdirSync("./db");

n.filter((f) => f.endsWith(".mid")).map((midiFile) => {
  loadMidi("./db/" + midiFile, createWriteStream("./db/csv/" + midiFile + ".csv"));
});
