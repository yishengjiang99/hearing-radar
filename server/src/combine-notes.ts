import { Note } from "@tonejs/midi/dist/Note";
import { CombinedNotes, MidiNote } from ".";

export const combineNotes = (header: Header, notes: Note[]): CombinedNotes[] =>
  notes.reduce((array: CombinedNotes[], note: Note) => {
    const lastNote = array.length > 0 && array[array.length - 1];
    if (lastNote && lastNote.ticks === note.measure) {
      lastNote.midis.push(note);
      if (note.start < lastNote.start) lastNote.start = note.start;
      if (note.end > lastNote.end) lastNote.end = note.end;
    } else {
      array.push({
        start: note.start,
        midis: [note],
        measure: note.measure,
        end: note.end,
      });
    }
    return array;
  }, new Array<CombinedNotes>());
