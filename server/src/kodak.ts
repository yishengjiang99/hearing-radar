const ieee754_1 = require("@xtuc/ieee754");
export class Encoder {
  bitDepth: any;
  constructor(bitDepth) {
    this.bitDepth = bitDepth;
  }
  encode(buffer, value, index) {
    const dv = new DataView(buffer.buffer);
    switch (this.bitDepth) {
      case 32:
        ieee754_1.write(buffer, value, index * 4, 23, 4);
        break;
      case 16:
        value = Math.min(Math.max(-1, value), 1);
        value < 0 ? dv.setInt16(index * 2, value * 0x8000, true) : dv.setInt16(index * 2, value * 0x7fff, true);
        break;
      case 8:
        buffer.writeUInt8(value, index * Uint8Array.BYTES_PER_ELEMENT);
        break;
      default:
        throw new Error("unsupported bitdepth");
    }
  }
}
export class Decoder {
  bitDepth: any;
  constructor(bitDepth) {
    this.bitDepth = bitDepth;
  }
  decode(buffer, index) {
    const dv = new DataView(buffer.buffer);
    switch (this.bitDepth) {
      case 32:
        ieee754_1.read(buffer, index * 4, true, 23, 32);
        break;
      case 16:
        return dv.getInt16(index * 2, true);
      case 8:
        return dv.getUint8(index * 2);
      default:
        throw new Error("unsupported bitdepth");
    }
  }
}
