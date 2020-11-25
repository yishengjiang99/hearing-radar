"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frequencyToNote = exports.keynotes = exports.keys = exports.blackKeys = exports.frequencyToMidi = exports.noteToMinorTriad = exports.midiToFreq = exports.noteToMajorTriad = exports.idxToFreq = exports.keyboardToFreq = exports.notesOfOctave = exports.melody = exports.chords = exports.notes = exports.notesOfIndex = exports.map_fft_bins_to_octaves = exports.FFTSIZE = exports.SAMPLE_RATE = void 0;
exports.SAMPLE_RATE = 2 << 16;
exports.FFTSIZE = 2 << 7;
exports.map_fft_bins_to_octaves = (octave) => {
    const note_hz = exports.notesOfOctave(octave);
    const hz_per_fft_bin = exports.SAMPLE_RATE / 2 / exports.FFTSIZE;
    const map = {};
    for (let i = 0; i < exports.FFTSIZE; i++) {
        const minHz = hz_per_fft_bin * i;
        for (let note_index = 0; note_index < note_hz.length; note_index++) {
            if (minHz >= note_hz[note_index]) {
                map[i] = note_index;
                break;
            }
        }
    }
    return map;
};
exports.notesOfIndex = [
    [16.35, 32.7, 65.41, 130.81, 261.63, 523.25, 1046.5, 2093.0],
    [17.32, 34.65, 69.3, 138.59, 277.18, 554.37, 1108.73, 2217.46],
    [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32],
    [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02],
    [20.6, 41.2, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02],
    [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83],
    [23.12, 46.25, 92.5, 185.0, 369.99, 739.99, 1479.98, 2959.96],
    [24.5, 49.0, 98.0, 196.0, 392.0, 783.99, 1567.98, 3135.96],
    [25.96, 51.91, 103.83, 207.65, 415.3, 830.61, 1661.22, 3322.44],
    [27.5, 55.0, 110.0, 220.0, 440.0, 880.0, 1760.0, 3520.0],
    [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31],
    [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07],
];
exports.notes = [
    261.63,
    277.18,
    293.66,
    311.13,
    329.63,
    349.23,
    369.99,
    392,
    415.3,
    440,
    466.16,
    493.88,
];
exports.chords = {
    C: ["C", "E", "G"],
    Db: ["Db", "F", "Ab"],
    D: ["D", "Gb", "A"],
    Eb: ["Eb", "F", "G"],
    E: ["E", "Ab", "B"],
    F: ["F", "A", "C"],
    Gb: ["Gb", "Bb", "Db"],
    G: ["G", "B", "D"],
    Ab: ["Ab", "E", "B"],
    A: ["A", "D", "Gb"],
    Bb: ["Bb", "Gb", "Db"],
    B: ["B", "Ab", "E"],
};
exports.melody = ["major", "major", "minor", "major"];
exports.notesOfOctave = (octave) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((idx) => exports.notesOfIndex[idx][octave]);
exports.keyboardToFreq = (key, octave) => {
    const idx = exports.keys.indexOf(key);
    const baseFreq = exports.notesOfIndex[idx][octave];
    return baseFreq;
};
exports.idxToFreq = (idx, octave) => {
    return exports.notesOfIndex[idx][octave];
};
exports.noteToMajorTriad = (baseFreq) => {
    return [baseFreq, baseFreq * 2, baseFreq * 4];
};
exports.midiToFreq = (midi) => {
    return Math.pow(2, (midi - 69) / 12) * 440;
};
exports.noteToMinorTriad = (baseFreq) => {
    const midi = ~~(12 * Math.log2(baseFreq / 440) + 69);
    return [baseFreq, exports.midiToFreq(midi + 3), exports.midiToFreq(midi + 7)];
};
exports.frequencyToMidi = (f) => ~~(12 * Math.log2(f / 440) + 69);
exports.blackKeys = ["w", "e", "t", "y", "u"];
exports.keys = [
    "a",
    "w",
    "s",
    "e",
    "d",
    "f",
    "t",
    "g",
    "y",
    "h",
    "u",
    "j",
];
exports.keynotes = [
    "C",
    "Db",
    "D",
    "Eb",
    "E",
    "F",
    "Gb",
    "G",
    "Ab",
    "A",
    "Bb",
    "B",
];
exports.frequencyToNote = (f) => {
    const midi = exports.frequencyToMidi(f);
    const octave = Math.floor(midi / 12);
    return octave + exports.keynotes[midi % 12];
};
//# sourceMappingURL=soundkeys.js.map