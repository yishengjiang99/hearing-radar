import { spawn, execSync, ChildProcess } from "child_process";
import { PassThrough, Writable } from "stream";
import { Buffer } from "buffer";
import { unlinkSync } from "fs";
import { resolve } from "path";
import { CacheStore } from "./flat-cache-store";
export type CastFunction = () => Writable;
export const pcm_note_size = 76216696 / 88;
export const castInput: CastFunction = () => {
	unlinkSync("input2");
	execSync("mkfifo input2");
	const pt = new PassThrough();
	const ff = spawn(
		"ffmpeg",
		`-debug-level=trace -i pipe:0 -re -f mulaw -f rtp rtp://127.0.0.1:1234`.split(
			" "
		)
	);
	pt.pipe(ff.stdin);

	ff.on("error", console.error);
	return pt;
};

const PCMCache = new Map<string, Buffer>();
type MidiNote = { midi: number; instrument: string };

export const cspawnToBuffer = async (cmd: string, str: string, ob: Buffer) => {
	await new Promise((resolve, reject) => {
		const { stdout, stderr } = spawn(cmd, str.split(" "));
		let offset = 0;
		stdout.on("data", (chunk) => {
			if (offset + chunk.byteLength > ob.byteLength) {
				console.trace();
				console.log(offset, chunk.byteLength, ob.byteLength);
			} else {
				ob.set(chunk, offset);
				offset += chunk.byteLength;
			}
		});
		stdout.on("error", reject);
		stderr.pipe(process.stdout);
		stdout.on("end", resolve);
	});
};
export function ffmpegToBuffer(args: string, ob: Buffer) {
	cspawnToBuffer(`ffmpeg`, args, ob);
}

export const mp3db = (inst: string, midi: number) =>
	resolve(__dirname, "../db/", inst, `${midi}.mp3`);

export type CombinedNotes = {
	start: number;
	midis: MidiNote[];
	buffer?: Buffer;
};
export const combinemp3 = async (
	combinedNote: CombinedNotes,
	noteCache: CacheStore,
	format: string,
	aoptions: string
): Promise<Buffer | undefined> => {
	const cacheKey = combinedNote.midis
		.map((note) => `${note.instrument}${note.midi}`)
		.join("_");

	if (noteCache.cacheKeys.includes(cacheKey)) {
		return noteCache.read(cacheKey);
	}

	const inputStr = combinedNote.midis
		.map((note) => `-i db/Fatboy_${note.instrument}/${note.midi}.mp3`)
		.join(" ");
	const filterStr = `-filter_complex amix=inputs=${combinedNote.midis.length}`;
	const ob = noteCache.malloc(cacheKey);
	const cmd = `-y -hide_banner -loglevel panic ${inputStr} ${filterStr} -t 2 -f ${format} ${aoptions} pipe:1`;
	await cspawnToBuffer("ffmpeg", cmd, ob);

	return ob;
};

export const spawnInputBuffer = (proc: ChildProcess, buffer?: Buffer) => {
	proc.on("error", console.error);
	const pt = new PassThrough();
	pt.pipe(proc.stdin);
	pt.write(buffer);
};
