"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readHeader = exports.wavHeader = void 0;
const fs_1 = require("fs");
const ssrctx_1 = require("./ssrctx");
var writeString = function (view, offset, str) {
    return str.split("").map(function (char, idx) {
        view.setUint8(offset + idx, char.charCodeAt(0));
    });
};
exports.wavHeader = function (length, sampleRate = 44100, numChannels = 2, bitDepth = 16) {
    var sampleRate = sampleRate;
    var numChannels = numChannels;
    var samples = length;
    var buffer = new ArrayBuffer(48);
    var view = new DataView(buffer);
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, bitDepth, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, (sampleRate * bitDepth) / 8, true);
    view.setUint16(32, (numChannels * bitDepth) / 8, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, (samples.length * bitDepth) / 8, true);
    return view.buffer;
};
exports.readHeader = (path) => {
    const fd = fs_1.openSync(path, "r");
    const ob = Buffer.alloc(48);
    fs_1.readSync(fd, ob, 0, 48, 0);
    const view = new DataView(ob.buffer);
    const [nChannels, sampleRate, _, __, bitDepth] = [
        view.getUint16(22, true),
        view.getUint32(24, true),
        view.getUint32(28, true),
        view.getUint32(32, true),
        view.getUint16(34, true),
    ];
    return new ssrctx_1.SSRContext({ nChannels, sampleRate, bitDepth });
};
//# sourceMappingURL=wav-header.js.map