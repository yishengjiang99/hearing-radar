export type MidiNote = {
  instrument: string;
  midi: number;
  measure: number;
  start: number;
  end: number;
  duration: number;
  buffer?: Buffer;
};
export type CombinedNotes = {
  start: number;
  midis: MidiNote[];
  buffer?: Buffer;
  measure: number;
};
