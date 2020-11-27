import { expect } from "chai";
import { openSync, readSync } from "fs";
import { Oscillator } from "./audio-data-source";
import { Encoder, Decoder } from "./kodak";
const floatEqual = (a, b) => {
  expect(a - b).lessThan(0.0001);
};
describe("codec", () => {
  it("encodes s16", () => {
    const encoder = new Encoder(16);
    const buffer = Buffer.alloc(4);
    encoder.encode(buffer, 0.1, 0);
    floatEqual(buffer[0] | (buffer[1] << 8), 0x7fff * 0.1);
    encoder.encode(buffer, -0.1, 1);
    floatEqual(buffer[0] | (buffer[1] << 8), 0x10000 - 0x8000 * -0.1);
  });

  it("decodes s16", () => {
    const dec = new Decoder(32);
    const fd = openSync("samples/440-f32le-ac2-ar-44199.pcm", "r");
    const ob = Buffer.alloc(4);
    let offset = 0;
    const fget32 = () => {
      readSync(fd, ob, 0, 4, offset);
      offset += 4;
      return ob;
    };
    while (offset < 1000) {
      console.log(dec.decode(fget32(), 0));
    }
  });
});
