"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const sampleDir = (filename) => require("path").resolve(__dirname, "../testdata", filename);
describe("fileSource", () => {
    it("reads from a file", (done) => {
        const ctx = new ssrctx_1.SSRContext({ nChannels: 1 });
        const file = new audio_data_source_1.FileSource(ctx, {
            filePath: sampleDir("440.pcm"),
        });
        const d = file.pullFrame();
        chai_1.expect(d).to.exist;
        chai_1.expect(d.byteLength).to.equal(ctx.blockSize);
        const readFile = fs_1.readFileSync(sampleDir("440.pcm"));
        const buff = readFile.slice(0, ctx.blockSize);
        chai_1.expect(buff).deep.equal(d);
        ctx.stop();
        done();
    });
});
describe("playaudio", () => {
    it("ssr must generate correct audio at 16bit signal", () => {
        const ctx = new ssrctx_1.SSRContext({
            bitDepth: 16,
            sampleRate: 9000,
            nChannels: 1,
        });
        const osc = new audio_data_source_1.Oscillator(ctx, { frequency: 440 });
        osc.start();
        const buffer = osc.pullFrame();
        chai_1.expect(buffer.length).to.equal(ctx.blockSize);
        chai_1.expect(buffer.byteLength).to.equal(128 * 2);
        ctx.start();
        ctx.stop(0.5);
    });
});
describe("scheduled buffere source", () => {
    const ctx = new ssrctx_1.SSRContext();
    const fd = fs_1.openSync(sampleDir("440.pcm"), "r");
    const buffer = Buffer.allocUnsafe(ctx.blockSize * 350);
    fs_1.readSync(fd, buffer, 0, ctx.blockSize * 350, 0);
    fs_1.closeSync(fd);
    it("should play about 1 second", (done) => {
        const node = new audio_data_source_1.BufferSource(ctx, {
            buffer: buffer,
            start: 0.12,
            end: 0.31,
        });
        chai_1.expect(ctx.inputs.length).to.equal(1);
        chai_1.expect(node.active).false;
        setTimeout(() => {
            chai_1.expect(node.active).true;
            setTimeout(() => {
                chai_1.expect(node.active).false;
                done();
            }, 330);
        }, 123);
        ctx.start();
    });
    afterEach(() => {
        ctx.stop(0);
    });
});
//# sourceMappingURL=audio-data-source.test.js.map