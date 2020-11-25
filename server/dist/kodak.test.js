"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
describe("codec", () => {
    it("decode s16", () => {
        const ctx = ssrctx_1.SSRContext.fromFileName("db/cache/s16le-ar9000-ac1-midi.csv.cache.pcm");
        chai_1.expect(ctx.bitDepth).eq(16);
        chai_1.expect(ctx.nChannels).eq(1);
        const file = new audio_data_source_1.FileSource(ctx, {
            filePath: "db/cache/s16le-ar9000-ac1-midi.csv.cache.pcm",
        });
        file.connect(ctx);
        const buff = file.pullFrame();
        console.log(buff);
    });
});
//# sourceMappingURL=kodak.test.js.map