"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_1 = require("fs");
const kodak_1 = require("./kodak");
const floatEqual = (a, b) => {
    chai_1.expect(a - b).lessThan(0.0001);
};
describe("codec", () => {
    it("encodes s16", () => {
        const encoder = new kodak_1.Encoder(16);
        const buffer = Buffer.alloc(4);
        encoder.encode(buffer, 0.1, 0);
        floatEqual(buffer[0] | (buffer[1] << 8), 0x7fff * 0.1);
        encoder.encode(buffer, -0.1, 1);
        floatEqual(buffer[0] | (buffer[1] << 8), 0x10000 - 0x8000 * -0.1);
    });
    it("decodes s16", () => {
        const dec = new kodak_1.Decoder(32);
        const fd = fs_1.openSync("samples/440-f32le-ac2-ar-44199.pcm", "r");
        const ob = Buffer.alloc(4);
        let offset = 0;
        const fget32 = () => {
            fs_1.readSync(fd, ob, 0, 4, offset);
            offset += 4;
            return ob;
        };
        while (offset < 1000) {
            console.log(dec.decode(fget32(), 0));
        }
    });
});
//# sourceMappingURL=kodak.test.js.map