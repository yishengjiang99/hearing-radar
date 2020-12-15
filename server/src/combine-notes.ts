import { Header } from "@tonejs/midi";
import { CombinedNotes, MidiNote } from ".";

export const combineNotes = (
  header: Header,
  notes: MidiNote[]
): CombinedNotes[] =>
  notes.reduce((array: CombinedNotes[], note: MidiNote) => {
    const lastNote = array.length > 0 && array[array.length - 1];
    if (lastNote && lastNote.start === note.measure) {
      lastNote.midis.push(note);
      if (note.start < lastNote.start) lastNote.start = note.start;
    } else {
      array.push({
        start: note.start,
        midis: [note],
        measure: note.measure,
      });
    }
    return array;
  }, new Array<CombinedNotes>());
