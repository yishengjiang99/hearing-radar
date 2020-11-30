"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
describe("filesource", () => {
    it("plays from a file", (done) => {
        const ctx = ssrctx_1.SSRContext.fromFileName("./samples/billie-ac2-ar-44100-s16le.pcm");
        const file = new audio_data_source_1.FileSource(ctx, {
            filePath: "./samples/billie-ac2-ar-44100-s16le.pcm",
        });
        file.connect(ctx);
        const play = child_process_1.spawn("ffplay", "-t 30 -i pipe:0 -ac 2 -ar 44100 -f s16le".split(" ")).stdin;
        ctx.on("data", (d) => {
            play.write(d);
        });
        ctx.start();
        setTimeout(() => {
            chai_1.expect(1);
            done();
        }, 30000);
    }).timeout(40000);
});
describe("oscilator", () => {
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
const sampleDir = (filename) => require("path").resolve(__dirname, "../samples", filename);
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
        node.connect(ctx);
        chai_1.expect(ctx.inputs.length).to.equal(1);
        chai_1.expect(node.active).false;
        setTimeout(() => {
            chai_1.expect(node.active).true;
            setTimeout(() => {
                chai_1.expect(node.active).false;
                done();
            }, 330);
        }, 200);
        ctx.start();
    });
    afterEach(() => {
        ctx.stop(0);
    });
});
//# sourceMappingURL=audio-data-source.test.js.map