"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const path_1 = require("path");
const chai_1 = require("chai");
const sampleDir = (filename) => path_1.resolve(__dirname, "../samples", filename);
describe("ssrctx", () => {
    it("sets framerate, bitdepths etc", () => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            bitDepth: 16,
            sampleRate: 9000,
        });
        chai_1.expect(ctx.fps).to.equal(ctx.sampleRate / 128);
        chai_1.expect(ctx.samplesPerFrame).to.equal(128 * 2);
        chai_1.expect(ctx.blockSize).to.equal(ctx.samplesPerFrame * ctx.sampleArray.BYTES_PER_ELEMENT);
        chai_1.expect(ctx.currentTime).to.equal(0);
        ctx.pump();
        chai_1.expect(ctx.currentTime).to.equal(ctx.secondsPerFrame);
    });
    it("stops on time", (done) => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            bitDepth: 16,
            sampleRate: 44100,
        });
        ctx.stop(0.1);
        ctx.start();
        setTimeout(() => {
            chai_1.expect(ctx.playing).false;
            done();
        }, 122);
    }).timeout(9000);
    it("parse bitdepth from filename", () => {
        const ctx = ssrctx_1.SSRContext.fromFileName(sampleDir("440-f32le-ac2-ar-44199.pcm"));
        chai_1.expect(ctx.bitDepth).to.equal(32);
        chai_1.expect(ctx.sampleRate).to.equal(ssrctx_1.SSRContext.defaultProps.sampleRate);
    });
    it("writes sufficient amount of data for playback", (done) => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            bitDepth: 32,
            sampleRate: 44100,
        });
        const fss = new audio_data_source_1.FileSource(ctx, {
            filePath: sampleDir("440-f32le-ac2-ar-44199.pcm"),
        });
        fss.connect(ctx);
        ctx.stop();
        done();
    });
});
//# sourceMappingURL=ssrctx.test.js.map