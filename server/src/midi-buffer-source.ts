import { openSync, readFile, readFileSync } from "fs";
import { ScheduledDataSource, BufferSource } from "./audio-data-source";
import { cspawnToBuffer, spawnInputBuffer } from "./ffmpeg-link";
import { SSRContext } from "./ssrctx";
import { CacheStore } from "./flat-cache-store";
type tick = number;
type MidiNote = {
	instrument: string;
	note: number;
	start: tick;
	duration: tick;
};
const tickToTime = (t: tick) => t / 1000;
/**
 * clarinet,67,0.28301699999999996,,256,116
 */
export const parseMidiCSV = (line: string): MidiNote => {
	const [instrument, note, _, _2, start, duration] = line.split(",");
	return {
		instrument,
		note: parseInt(note),
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
		const input = `db/Fatboy_${note.instrument}/${note.note - 21}.mp3`;
		const cacheKey = `${input}${ctx.sampleRate}`;

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

export const loadCSV = async (ctx: SSRContext, csvFile: string) => {
	const noteCache = initCache(ctx);
	const bufferSrc = readFileSync(csvFile)
		.toString()
		.split("\n")
		.map((line) => parseMidiCSV(line))
		.map((note) => {
			return new BufferSource(ctx, {
				start: tickToTime(note.start),
				end: tickToTime(note.start + note.duration),
				loadBuffer: () => loadBuffer(ctx, note, noteCache),
			});
		});
};

export const midiBufferSource = (
	ctx: SSRContext,
	midiCSV: string,
	cacheStore
) => {
	const note = parseMidiCSV(midiCSV);
	return new BufferSource(ctx, {
		start: tickToTime(note.start),
		end: tickToTime(note.start + note.duration),
		loadBuffer: () => loadBuffer(ctx, note, cacheStore),
	});
};

const test = async () => {
	const ctx = new SSRContext({
		nChannels: 1,
		bitDepth: 16,
		sampleRate: 9000,
	});
	const cache = initCache(ctx);
	await loadBuffer(
		ctx,
		parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"),
		cache
	);
	await loadBuffer(
		ctx,
		parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"),
		cache
	);
};
test();
