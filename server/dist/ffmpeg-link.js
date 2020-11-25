"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnInputBuffer = exports.combinemp3 = exports.mp3db = exports.ffmpegToBuffer = exports.cspawnToBuffer = exports.castInput = exports.pcm_note_size = void 0;
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const fs_1 = require("fs");
const path_1 = require("path");
exports.pcm_note_size = 76216696 / 88;
exports.castInput = () => {
    fs_1.unlinkSync("input2");
    child_process_1.execSync("mkfifo input2");
    const pt = new stream_1.PassThrough();
    const ff = child_process_1.spawn("ffmpeg", `-debug-level=trace -i pipe:0 -re -f mulaw -f rtp rtp://127.0.0.1:1234`.split(" "));
    pt.pipe(ff.stdin);
    ff.on("error", console.error);
    return pt;
};
exports.cspawnToBuffer = (cmd, str, ob) => __awaiter(void 0, void 0, void 0, function* () {
    yield new Promise((resolve, reject) => {
        const { stdout, stderr } = child_process_1.spawn(cmd, str.split(" "));
        let offset = 0;
        stdout.on("data", (chunk) => {
            if (offset + chunk.byteLength > ob.byteLength) {
                console.trace();
                console.log(offset, chunk.byteLength, ob.byteLength);
            }
            else {
                ob.set(chunk, offset);
                offset += chunk.byteLength;
            }
        });
        stdout.on("error", reject);
        stderr.pipe(process.stdout);
        stdout.on("end", resolve);
    });
});
function ffmpegToBuffer(args, ob) {
    exports.cspawnToBuffer(`ffmpeg`, args, ob);
}
exports.ffmpegToBuffer = ffmpegToBuffer;
exports.mp3db = (inst, midi) => path_1.resolve(__dirname, "../db/", inst, `${midi}.mp3`);
exports.combinemp3 = (combinedNote, noteCache, format, aoptions) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = combinedNote.midis.map((note) => `${note.instrument}${note.midi}`).join("_");
    if (noteCache.cacheKeys.includes(cacheKey)) {
        return noteCache.read(cacheKey);
    }
    const inputStr = combinedNote.midis.map((note) => `-i db/Fatboy_${note.instrument}/${note.midi}.mp3`).join(" ");
    const filterStr = `-filter_complex amix=inputs=${combinedNote.midis.length}`;
    const ob = noteCache.malloc(cacheKey);
    const cmd = `-y -hide_banner -loglevel panic ${inputStr} ${filterStr} -t 2 -f ${format} ${aoptions} pipe:1`;
    yield exports.cspawnToBuffer("ffmpeg", cmd, ob);
    return ob;
});
exports.spawnInputBuffer = (proc, buffer) => {
    proc.on("error", console.error);
    const pt = new stream_1.PassThrough();
    pt.pipe(proc.stdin);
    pt.write(buffer);
};
//# sourceMappingURL=ffmpeg-link.js.map