import { LSGraph, LSSource, ReadlineTransform } from "grep-transform";

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

const lsgraph = new LSGraph("/");

LSSource("ls -R -m ./midisf").pipe(new ReadlineTransform()).pipe(lsgraph);
lsgraph.on("data", (d) => {
  const n = JSON.parse(d);
  process.stdout.write(n.n1 + "\n");
  process.stdout.write("\n" + n.dag.map((edge) => n.n1 + "/" + edge));
});
lsgraph.on("end", () => {
  console.log("end");
});
