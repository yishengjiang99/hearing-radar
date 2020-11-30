export class Encoder {
  bitDepth: any;
  constructor(bitDepth) {
    this.bitDepth = bitDepth;
  }
  encode(buffer, value, index) {
    const dv = new DataView(buffer.buffer);
    switch (this.bitDepth) {
      case 32:
        write(buffer, value, index * 4, true, 23, 4);
        break;
      case 16:
        value = Math.min(Math.max(-1, value), 1);
        value < 0
          ? dv.setInt16(index * 2, value * 0x8000, true)
          : dv.setInt16(index * 2, value * 0x7fff, true);
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
        return read(buffer, index * 4, true, 23, 32);
      case 16:
        return dv.getInt16(index * 2, true);
      case 8:
        return dv.getUint8(index * 2);
      default:
        throw new Error("unsupported bitdepth");
    }
  }
}

//below code were confiscated from \@xtuc/ieee754 (with just cause)
//to due npm bloatedness.
export function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer[offset + i];

  i += d;

  e = s & ((1 << -nBits) - 1);
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << -nBits) - 1);
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}

export function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (
    ;
    mLen >= 8;
    buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8
  ) {}

  e = (e << mLen) | m;
  eLen += mLen;
  for (
    ;
    eLen > 0;
    buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8
  ) {}

  buffer[offset + i - d] |= s * 128;
}
