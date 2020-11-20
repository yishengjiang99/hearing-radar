#!/usr/bin/node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMidi = void 0;
const midi_1 = require("@tonejs/midi");
const fs_1 = require("fs");
async function loadMidi(filename, output) {
    console.log(filename);
    const midi = await new midi_1.Midi(fs_1.readFileSync(filename));
    return midi.tracks.map((track) => track.notes.forEach((note) => {
        process.stdout.write([
            track.channel,
            track.instrument.name,
            note.midi,
            note.ticks,
            note.durationTicks,
            note.name,
            note.ticks,
            note.durationTicks,
            note.velocity,
            midi.header.ticksToSeconds(note.ticks),
            midi.header.ticksToSeconds(note.ticks) + midi.header.ticksToSeconds(note.durationTicks),
        ].join(",") + "\n");
    }));
}
exports.loadMidi = loadMidi;
if (process.argv[1])
    loadMidi(process.argv[1], fs_1.createWriteStream(process.argv[1] + ".csv"));
//# sourceMappingURL=load-sort-midi.js.map
