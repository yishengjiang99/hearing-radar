"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMidi = void 0;
var midi_1 = require("@tonejs/midi");
var fs_1 = require("fs");
function loadMidi(filename, output) {
    console.log(filename, output);
    var midi = new midi_1.Midi(fs_1.readFileSync(filename).buffer);
    return midi.tracks.map(function (track) {
        return track.notes.forEach(function (note) {
            output.write([
                track.channel,
                track.instrument.name,
                note.midi,
                midi.header.ticksToSeconds(note.ticks),
                midi.header.ticksToSeconds(note.durationTicks),
                note.ticks,
                note.durationTicks,
                note.name,
            ].join(",") + "\n");
        });
    });
}
exports.loadMidi = loadMidi;
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
var n = fs_1.readdirSync("./db");
n.filter(function (f) { return f.endsWith(".mid"); }).map(function (midiFile) {
    loadMidi("./db/" + midiFile, fs_1.createWriteStream("./db/csv/" + midiFile + ".csv"));
});
