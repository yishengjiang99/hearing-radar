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
const chai_1 = require("chai");
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const midi_buffer_source_1 = require("./midi-buffer-source");
const ssrctx_1 = require("./ssrctx");
const tickToTime = (t) => t / 1000;
describe("midi-buffersource", () => {
    const ctx = new ssrctx_1.SSRContext({
        nChannels: 1,
        bitDepth: 16,
        sampleRate: 9000,
    });
    it("it loads buffer from file", () => __awaiter(void 0, void 0, void 0, function* () {
        const cache = initCache(ctx);
        const buffer = yield midi_buffer_source_1.loadBuffer(ctx, midi_buffer_source_1.parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"), cache);
        const buffer2 = yield midi_buffer_source_1.loadBuffer(ctx, midi_buffer_source_1.parseMidiCSV("clarinet,67,0.28301699999999996,,256,116"), cache);
        chai_1.expect(cache.length).to.equal(1);
        ctx.stop(0);
    }));
    it("makes BufferSource", () => __awaiter(void 0, void 0, void 0, function* () {
        const cache = initCache(ctx);
        const note = midi_buffer_source_1.parseMidiCSV("clarinet,67,,,0,116");
        yield midi_buffer_source_1.loadBuffer(ctx, note, cache);
        const brs = new audio_data_source_1.BufferSource(ctx, {
            start: tickToTime(note.start),
            end: tickToTime(note.start + note.duration),
            getBuffer: () => cache.read(`${note.instrument}${note.note}`),
        });
        let offset = 0;
        const buffer = brs.pullFrame();
        buffer.readInt16LE(offset);
        while (offset < ctx.blockSize) {
            const n = buffer.readInt16LE(offset);
            offset += 2;
        }
    }));
    it("add as a track to ssr context", (done) => {
        let line = `clarinet,67,0.14150849999999998,,0,116`;
        const note = midi_buffer_source_1.parseMidiCSV(line);
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 1,
            bitDepth: 16,
            sampleRate: 9000,
        });
        const cache = initCache(ctx);
        midi_buffer_source_1.loadBuffer(ctx, note, cache).then((buffer) => {
            new audio_data_source_1.BufferSource(ctx, {
                start: tickToTime(note.start),
                end: tickToTime(note.start + note.duration),
                buffer: buffer,
            });
            const output = fs_1.createWriteStream("outputfile.wav");
            output.write(new Uint8Array(ctx.WAVHeader));
            ctx.connect(output);
            ctx.start();
            setTimeout(() => {
                ctx.stop(0);
                done();
            }, 400);
        });
    }).timeout(2000);
});
//# sourceMappingURL=midi-buffer-source.test.js.map