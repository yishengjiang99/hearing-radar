import { parseMidiCSV, MidiNote } from "./parseMidi";
let ctx: AudioContext;
const btn = document.createElement("button");
btn.textContent = "start";
const cacheStore = {};
btn.addEventListener("click", async () => {
	ctx = new AudioContext();
	let t0;
	const g = new GainNode(ctx);
	g.connect(ctx.destination);
	const csv = await (await fetch("/db/midi.csv")).text();
	const lines = csv.split("\n");
	for await (const note of (async function* () {
		while (lines.length) {
			const note: MidiNote = parseMidiCSV(lines.shift());
			if (t0 && note.start > ctx.currentTime - t0 + 5.0) {
				await new Promise((resolve) => setTimeout(resolve, 3.0));
			}
			const url = `/db/Fatboy_${note.instrument}/${note.note}.mp3`;
			note.buffer =
				cacheStore[url] ||
				(await fetch(url)
					.then((res) => res.arrayBuffer())
					.then((ab: ArrayBuffer) => ctx.decodeAudioData(ab))
					.catch((e) => alert(e.message + url)));
			cacheStore[url] = cacheStore[url] || note.buffer;
			yield note;
		}
	})()) {
		t0 = t0 || ctx.currentTime;
		const abs = new AudioBufferSourceNode(ctx, { buffer: note.buffer });
		document.body.innerHTML = "starting at " + note.start + t0;
		abs.start(note.start);
		abs.stop(note.start + note.duration + t0);
		abs.connect(g);
	}
});
document.body.appendChild(btn);
