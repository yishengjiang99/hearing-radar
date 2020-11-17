import { createWriteStream, readFileSync } from "fs";
import { ScheduledDataSource, BufferSource } from "./audio-data-source";
import { cspawnToBuffer, spawnInputBuffer, combinemp3 } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { cacheStore, CacheStore } from "./flat-cache-store";
import { execSync, spawn } from "child_process";
import { notes } from "./soundkeys";
import { PassThrough } from "stream";
type tick = number;
type MidiNote = {
	instrument: string;
	midi: number;
	start: tick;
	duration: tick;
};
export const tickToTime = (t: tick) => t / 1000;
type CombinedNotes = {
	start: number;
	midis: MidiNote[];
	buffer?: Buffer;
};
export const parseMidiCSV = (line: string): MidiNote => {
	const [instrument, note, _, _2, start, duration] = line.split(",");
	return {
		instrument: instrument
			.replace(" ", "_")
			.replace(" ", "_")
			.replace(" ", "_"),
		midi: parseInt(note) - 21,
		start: tickToTime(parseInt(start)),
		duration: tickToTime(parseInt(duration)),
	};
};
export const initCache = (ctx: SSRContext) => {
	const byteLength = ctx.bytesPerSecond * 2;
	return new CacheStore(221, byteLength);
};
async function t2(ctxstr, midiFile, outfile) {
	const ctx = SSRContext.fromFileName(ctxstr);
	const outfilefs = createWriteStream(outfile);
	const uniqNotes = parseInt(
		execSync(`cat ${midiFile} |cut -f1,2 -d',' |sort|uniq|wc -l`)
			.toString()
			.trim()
	);
	const noteCache = new CacheStore(
		uniqNotes * 10,
		ctx.bytesPerSecond * 2,
		`db/cache/${ctxstr}${midiFile}`
	);
	let lines = readFileSync(midiFile).toString().trim().split("\n");

	let notes = lines.reduce(
		(array: CombinedNotes[], line: string, _: number, arr: string[]) => {
			const tokens = line.split(",");
			const note: MidiNote = parseMidiCSV(line);
			const { instrument, start, duration, midi } = note;

			const lastNote = array.length > 0 && array[array.length - 1];
			if (lastNote.start === start && lastNote) {
				lastNote.midis.push(note);
			} else {
				array.push({
					start: start,
					midis: [note],
				});
			}
			return array;
		},
		new Array<CombinedNotes>()
	);

	const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
	const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;

	for await (const noteBuffer of (async function* () {
		while (notes.length) {
			const note = notes.shift();
			const obs = new BufferSource(ctx, {
				buffer: await combinemp3(note, noteCache, format, aoptions),
				start: note.start,
				end: note.start + note.midis[0].duration,
			});
			obs.connect(ctx);
		}
	})()) {
		//console.log(noteBuffer);
	}
	ctx.connect(outfilefs);
	ctx.start();

	noteCache.persist();
}

t2("s16le-ar48000-ac2-", "string-midi.csv", "string-highres.wav");
