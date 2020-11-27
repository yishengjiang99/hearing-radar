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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playCsv = exports.playCSVmidi = exports.loadBuffer = exports.parseMidiCSV = void 0;
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const ffmpeg_link_1 = require("./ffmpeg-link");
const ssrctx_1 = require("./ssrctx");
const flat_cache_store_1 = require("./flat-cache-store");
const path_1 = require("path");
const midi_1 = require("@tonejs/midi");
exports.parseMidiCSV = (line) => {
    const [instrument, note, duration, start, end] = line.split(",");
    return {
        instrument,
        midi: parseInt(note),
        duration: parseFloat(duration),
        start: parseFloat(start),
        end: parseFloat(end),
    };
};
exports.loadBuffer = (ctx, note, noteCache) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const aoptions = `-ac ${ctx.nChannels} -ar ${ctx.sampleRate}`;
        const format = `${ctx.bitDepth === 16 ? "s16le" : "f32le"}`;
        const input = `db/Fatboy_${note.instrument}/${note.note}.mp3`;
        const cacheKey = `${note.instrument}${note.note}`;
        if (noteCache.cacheKeys.includes(cacheKey) &&
            noteCache.read(cacheKey) !== null) {
            return noteCache.read(cacheKey);
        }
        const ob = noteCache.malloc(cacheKey);
        const cmd = `-hide_banner -loglevel panic -t 2 -i ${input} -f ${format} ${aoptions} pipe:1`;
        yield ffmpeg_link_1.cspawnToBuffer("ffmpeg", cmd, ob);
        return ob;
    }
    catch (e) {
        console.error(e);
    }
    finally {
    }
});
exports.playCSVmidi = (ctx, notes, cacheFileName) => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const uniqs = new Set();
    const uniqNotes = notes.map((n) => uniqs.add(n.instrument + n.note));
    const noteCache = new flat_cache_store_1.CacheStore(uniqNotes.length, ctx.bytesPerSecond * 2, cacheFileName);
    try {
        for (var _b = __asyncValues((function () {
            return __asyncGenerator(this, arguments, function* () {
                while (notes.length) {
                    const note = notes.shift();
                    yield __await(exports.loadBuffer(ctx, note, noteCache));
                    const brs = new audio_data_source_1.BufferSource(ctx, {
                        start: note.start - 40,
                        end: note.end - 40,
                        getBuffer: () => noteCache.read(`${note.instrument}${note.note}`),
                    });
                    brs.connect(ctx);
                    yield yield __await(brs);
                }
            });
        })()), _c; _c = yield _b.next(), !_c.done;) {
            const brs = _c.value;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    noteCache.persist();
});
const filename = "../Beethoven-Symphony5-1.mid";
const writeToCsv = (filename) => {
    const wfs = path_1.resolve(__dirname, "../csv/", path_1.basename(filename) + ".csv");
    const { header, tracks } = new midi_1.Midi(fs_1.readFileSync(path_1.resolve(__dirname, filename)).buffer);
    fs_1.writeFileSync(wfs, header.name);
    fs_1.appendFileSync(wfs, "\n#inst,midi,duration,statt,end");
    tracks.map((t) => {
        t.notes.map((note) => {
            const obj = {
                instrument: t.instrument.name
                    .replace(" ", "_")
                    .replace(" ", "_")
                    .replace(" ", "_")
                    .replace("(", "")
                    .replace(")", ""),
                note: note.midi,
                duration: header.ticksToSeconds(note.durationTicks),
                start: header.ticksToSeconds(note.ticks),
                end: header.ticksToSeconds(note.ticks) +
                    header.ticksToSeconds(note.durationTicks),
            };
            fs_1.appendFileSync(wfs, "\n" + Object.values(obj).join(","));
            console.log(obj);
        });
    });
    return filename + ".csv";
};
const ctx = ssrctx_1.SSRContext.fromFileName("-ac1-s16le");
function playCsv(ctx, csv, outfile) {
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const uniqNotes = parseInt(require("child_process")
            .execSync(`cat ${csv} |cut -f1,2 -d',' |sort|uniq|wc -l`)
            .toString()
            .trim());
        const noteCache = new flat_cache_store_1.CacheStore(uniqNotes, ctx.bytesPerSecond * 2, path_1.resolve(`db/cache/${path_1.basename(csv)}`));
        let notes = fs_1.readFileSync(csv)
            .toString()
            .trim()
            .split("\n")
            .map((line) => exports.parseMidiCSV(line));
        try {
            for (var _b = __asyncValues((function () {
                return __asyncGenerator(this, arguments, function* () {
                    while (notes.length) {
                        const note = notes.shift();
                        const brs = new audio_data_source_1.BufferSource(ctx, {
                            start: note.start,
                            end: note.end,
                            getBuffer: () => noteCache.read(`${note.instrument}${note.note}`),
                        });
                        yield __await(exports.loadBuffer(ctx, note, noteCache));
                        yield yield __await(brs);
                    }
                });
            })()), _c; _c = yield _b.next(), !_c.done;) {
                const brs = _c.value;
                ctx.inputs.push(brs);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        noteCache.persist();
        const fs = fs_1.createWriteStream(outfile);
        ctx.connect(fs_1.createWriteStream(outfile));
        ctx.prepareUpcoming();
        ctx.on("data", (d) => {
            console.log(".");
            fs.write(d);
        });
        ctx.start();
        return ctx;
    });
}
exports.playCsv = playCsv;
writeToCsv("../Beethoven-Symphony5-1.mid");
//# sourceMappingURL=midi-buffer-source.js.map