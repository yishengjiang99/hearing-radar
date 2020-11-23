// import { openSync, readSync, closeSync } from "fs";
// import { Buffer } from "buffer";
// import { spawn, ChildProcess } from "child_process";
// import { cacheStore } from "./flat-cache-store";
// import { cspawnToBuffer, ffmpegToBuffer as spawnToBuffer } from "./ffmpeg-link";

// export const bytesPerNote = 887832 / 88;
// export const bytesPCMPerNote = 38452;

// const cache = cacheStore(200, bytesPerNote);
// const pcmCache = cacheStore(200, bytesPCMPerNote);
// export const midi_sample_mp3 = (instrument: string, midi: number): Buffer => {
//   const cacheKey: string = instrument + midi;
//   let cachedValue = cache.read(cacheKey);
//   console.log("cachedvalue", cachedValue);
//   if (cachedValue) return cachedValue;
//   console.log(cache.cacheKeys);
//   const fd = openSync(`./db/${instrument.replace(" ", "_")}/${midi + 21}.mp3`, "r");
//   const segment = cache.malloc(cacheKey);
//   readSync(fd, segment);
//   closeSync(fd);
//   return segment;
// };

// export const midi_s16le_ac1_ar_9000 = async (instrument: string, midi: number): Promise<Buffer> => {
//   const cacheKey: string = instrument + midi;
//   let cachedValue = pcmCache.read(cacheKey);
//   if (cachedValue) return cachedValue;

//   const infile = `./db/${instrument.replace(" ", "_")}/${midi - 21}.mp3`;

//   const buf = pcmCache.malloc(infile);
//   await cspawnToBuffer(`ffmpeg`, `-i ${infile} -f s16le -ac 1 -ar 9000`, buf);
//   pcmCache.set(cacheKey, buf);
//   return buf;
// };

// export type Note = [number, string];
// export interface Attributes {
//   "-t": number;
// }
// export const combinemp3 = async (notes: Note[], attributes: Attributes): Promise<Buffer> => {
//   const cacheKey: string = notes.map(([midi, instrument]) => midi + instrument).join("-");
//   let cachedValue = pcmCache.read(cacheKey);
//   if (cachedValue) return cachedValue;
//   const ob = pcmCache.malloc(cacheKey);
//   const cmdargs = `-hide_banner -loglevel panic -t 2 -i ${notes.reduce((args, [midi, instrument]) => {
//     return args + ` -i ./db/Fatboy_${instrument}/${midi - 21}.mp3`;
//   }, "")} -ac 1 -ar 44100 -filter_complex 'amix=inputs=${notes.length}' -f mp3 -`;
//   console.log(cmdargs);
//   await cspawnToBuffer("ffmpeg", cmdargs, ob); //pcmCache.malloc(cmdargs));
//   return ob;
// };

// export const ffplayPCM = (format: string = " -f s16le -ac 1 -ar 9000 ") => {
//   return spawn("ffplay", `-i pipe:0 ${format}`.split(" "));
// };
// combinemp3(
//   [
//     [67, "clarinet"],
//     [67, "string_ensemble_1"],
//     [67, "string_ensemble_1"],
//     [55, "string_ensemble_1"],
//     [43, "string_ensemble_1"],
//     [43, "string_ensemble_1"],
//   ],
//   { "-t": 0.22 }
// ).then((bf) => process.stdout.write(bf));
