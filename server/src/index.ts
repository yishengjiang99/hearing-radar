export type MidiNote = {
  instrument: string;
  midi?: number;
  measure?: number;
  start: number;
  end?: number;
  duration: number;
  buffer?: Buffer;
  note?: number;
};
export type CombinedNotes = {
  start: number;
  midis: MidiNote[];
  buffer?: Buffer;
  measure: number;
};
