import { createWriteStream, readFileSync } from "fs";
import { ScheduledDataSource, BufferSource } from "./audio-data-source";
import { cspawnToBuffer, spawnInputBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { cacheStore, CacheStore } from "./flat-cache-store";
import { execSync, spawn } from "child_process";
import { notes } from "./soundkeys";
import { PassThrough } from "stream";

type tick = number;
type MidiNote = {
	instrument: string;
	note: number;
	start: tick;
	duration: tick;
};
export const tickToTime = (t: tick) => t / 1000;
/**
 * clarinet,67,0.28301699999999996,,256,116
 */
export const parseMidiCSV = (line: string): MidiNote => {
	const [instrument, note, _, _2, start, duration] = line.split(",");
	return {
		instrument: instrument
			.replace(" ", "_")
			.replace(" ", "_")
			.replace(" ", "_"),
		note: parseInt(note) - 21,
		start: parseInt(start),
		duration: parseInt(duration),
	};
};
export const initCache = (ctx: SSRContext) => {
	const byteLength = ctx.bytesPerSecond * 2;
	return new CacheStore(221, byteLength);
};

export const loadBuffer = async (
	ctx: SSRContext,
	note: MidiNote,
	noteCache: CacheStore
) => {
	try {
		const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
		const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
		const input = `db/Fatboy_${note.instrument}/${note.note}.mp3`;
		const cacheKey = `${note.instrument}${note.note}`;

		if (noteCache.cacheKeys.includes(cacheKey)) {
			return noteCache.read(cacheKey);
		}
		const ob = noteCache.malloc(cacheKey);
		const cmd = `-hide_banner -loglevel panic -t 2 -i ${input} -f ${format} ${aoptions} pipe:1`;
		await cspawnToBuffer("ffmpeg", cmd, ob);

		return ob;
	} catch (e) {
		console.error(e);
	} finally {
	}
};

export const preCacheNotes = async (ctxstr: string, midiFile: string) => {
	const ctx = SSRContext.fromFileName(ctxstr);
	const uniqNotes = parseInt(
		execSync(`cat ${midiFile} |cut -f1,2 -d',' |sort|uniq|wc -l`)
			.toString()
			.trim()
	);
	const noteCache = new CacheStore(
		uniqNotes,
		ctx.bytesPerSecond * 2,
		`db/cache/${ctxstr}${midiFile}`
	);
	let notes = readFileSync(midiFile)
		.toString()
		.trim()
		.split("\n")
		.map((line) => parseMidiCSV(line));

	for await (const _ of (async function* () {
		while (notes.length) {
			yield await loadBuffer(ctx, notes.shift(), noteCache);
		}
	})());

	noteCache.persist();

	readFileSync(midiFile)
		.toString()
		.trim()
		.split("\n")
		.map((line) => parseMidiCSV(line))
		.map((note) => {
			const brs = new BufferSource(ctx, {
				start: tickToTime(note.start),
				end: tickToTime(note.start + note.duration),
				getBuffer: () =>
					noteCache.read(`${note.instrument}${note.note}`),
			});
			brs.connect(ctx);
		});
	return ctx;
};
export function playCsv(ctxString: string, csv: string, outfile: string) {
	preCacheNotes(ctxString, csv).then((ctx) => {
		const output = createWriteStream(outfile);
		//	output.write(Buffer.from(ctx.WAVHeader));
		ctx.connect(output);
		ctx.start();
		ctx.on("data", (d) => {
			let offset = 0;
			while (offset * 2 < d.byteLength - 2) {
				const n = d.readInt16LE(offset);
				offset++;
				process.stdout.write(n + "\n");
			}
		});
	});
}
// playCsv("s16le-ar9000-ac1-", "string-midi.csv", "clarinet.wav");

async function test() {
	const ctx = new SSRContext({
		nChannels: 2,
		bitDepth: 16,
		sampleRate: 44100,
	});
	const cache = initCache(ctx);

	const note = parseMidiCSV("clarinet,67,,,0,116");
	await loadBuffer(ctx, note, cache);
	console.log(note.start);
	const brs = new BufferSource(ctx, {
		start: tickToTime(note.start),
		end: tickToTime(note.start + note.duration),
		getBuffer: () => cache.read(`${note.instrument}${note.note}`),
	});
	console.log(brs._start);
	brs.connect(ctx);
	const pt = new PassThrough();

	const wt = createWriteStream("t1.wav");
	ctx.connect(wt);
	ctx.start();
	pt.on("data", (d) => {
		let offset = 0;
		while (offset * 2 < d.byteLength - 2) {
			const n = d.readInt16LE(offset);
			offset++;
			process.stdout.write(n + "\n");
		}
	});
	// while (offset * 2 < buffer.byteLength - 2) {
	// 	const n = buffer.readInt16LE(offset);
	// 	offset++;
	// 	process.stdout.write(n + ",");
	// }
}
// test();
