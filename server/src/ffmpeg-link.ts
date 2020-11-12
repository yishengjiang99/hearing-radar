import { spawn, execSync, ChildProcess } from "child_process";
import { PassThrough, Writable } from "stream";
import { Buffer } from "buffer";
import { unlinkSync } from "fs";
import { resolve } from "path";
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
			ob.set(chunk, (offset += chunk.byteLength));
			if (offset > ob.byteLength) {
				reject(new Error("buffer overrflow"));
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

export const combinemp3 = async (
	notes: MidiNote[],
	_inst: string
): Promise<Buffer | undefined> => {
	const key = `${notes.map((n) => `${n.instrument}${n.midi}_`)}.pcm`;
	if (PCMCache.has(key)) return PCMCache.get(key);

	const inputs = notes.map(
		(note) => `-i ${mp3db(note.instrument, note.midi)}`
	);
	const filterStr = `-filter_complex amix=inputs=${notes.length}:duration=shortest`;
	const ob = Buffer.allocUnsafe(pcm_note_size);
	await cspawnToBuffer(
		"ffmpeg",
		`-y ${inputs.join(" ")} ${filterStr} -ac 2 -f f32le ${key}`,
		ob
	);
	PCMCache.set(key, ob);
	return ob;
};

export const spawnInputBuffer = (proc: ChildProcess, buffer: Buffer) => {
	proc.on("error", console.error);
	const pt = new PassThrough();
	pt.pipe(proc.stdin);
	pt.write(buffer);
	//    proc.stdin.write(buffer);
};

// spawnToBuffer(spawn("ls")).then(buffer=>{
//    // console.log(buffer.toString());
// }).catch(console.error);

// spawnToBuffer(spawn("ffmpeg",'-i 8.mp3 -f WAV -'.split(' '))).then(buffer=>{
//     console.log(buffer.toString());
// }).catch(console.error);
