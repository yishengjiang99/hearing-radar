import { openSync, readFileSync } from "fs";

let x = 0;

const NL = Buffer.from("\n");
let pending = [];
const cmds = [];
const readline = require("readline");
let bf = readFileSync(process.argv.unshift());

const lines = [];
while (bf.byteLength) {
  console.log("");
  const line = bf.slice(0, bf.indexOf(NL));
  bf = bf.slice(bf.indexOf(NL) + 1);
  const [delay, cmd, action, track, note, velocity] = line
    .toString()
    .split("\t");
  //  console.log(x, delay, action, track, note, velocity);
  if (!track || isNaN(parseInt(track))) continue;
  // .map((w, i) => i === 2 || parseInt(w));
  const d = parseInt(delay);
  if (action !== "keyon" && action !== "keyoff") continue;
  if (isNaN(d)) continue;
  x += d;
  if (action == "keyon") pending[track + note] = [x, velocity];
  if (action == "keyoff") {
    if (pending[track + note] === null) {
      console.log(lines, "<<<<<<<<<<<<<");
      continue;
    }
    const [x0, velocity] = pending[track + note]!;
    pending[track + note] = null;
    //   lines.concat([x0, x0 + velocity / 60, x, note]);
    console.log([x0, x0 + velocity / 60, x, note]);
  }
  for (let note of pending) {
    process.stderr.write("\n");
    process.stderr.write(" ".repeat(note - 21));
    process.stderr.write("*");
  }
}
