"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRContext = exports.timediff = void 0;
const events_1 = require("events");
const wav_header_1 = require("./wav-header");
const kodak_1 = require("./kodak");
exports.timediff = (t1, t2) => {
    return t1[0] + t1[1] / 1e9 - (t2[0] + t2[1] / 1e9);
};
class SSRContext extends events_1.EventEmitter {
    constructor(props = SSRContext.defaultProps) {
        super();
        this.inputs = [];
        this.start = () => {
            this.playing = true;
            if (this.output === null)
                return;
            let that = this;
            this.emit("data", Buffer.from(this.WAVHeader));
            let timer = setInterval(() => {
                that.pump();
                if (!that.playing || (that.end && that.currentTime >= that.end)) {
                    that.stop(0);
                    clearInterval(timer);
                }
                this.prepareUpcoming();
            }, this.secondsPerFrame);
        };
        const { nChannels, sampleRate, fps, bitDepth } = Object.assign(Object.assign({}, SSRContext.defaultProps), props);
        this.nChannels = nChannels;
        this.sampleRate = sampleRate;
        this.fps = sampleRate / 128;
        this.frameNumber = 0;
        this.bitDepth = bitDepth;
        this.encoder = new kodak_1.Encoder(this.bitDepth);
        this.decoder = new kodak_1.Decoder(this.bitDepth);
        this.playing = true;
    }
    get secondsPerFrame() {
        return 1 / this.fps;
    }
    get samplesPerFrame() {
        return (this.sampleRate * this.nChannels) / this.fps;
    }
    get inputSources() {
        return this.inputs.filter((i) => i.active);
    }
    get WAVHeader() {
        return wav_header_1.wavHeader(30 * this.sampleRate, this.sampleRate, this.nChannels, this.bitDepth);
    }
    encode(buffer, value, index) {
        this.encoder.encode(buffer, value, index);
    }
    get sampleArray() {
        switch (this.bitDepth) {
            case 32:
                return Uint32Array;
            case 16:
                return Int16Array;
            case 8:
                return Uint8Array;
            default:
                return Int16Array;
        }
    }
    pump() {
        this.lastFrame = process.hrtime();
        let ok = true;
        this.frameNumber++;
        for (let i = 0; i < this.inputSources.length; i++) {
            const b = this.inputSources[i].pullFrame();
            b && this.emit("data", b);
        }
        return ok;
    }
    prepareUpcoming() {
        var _a;
        let newInputs = [];
        const t = this.currentTime;
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].ended() === false) {
                newInputs.push(this.inputs[i]);
                (_a = this.inputs[i]) === null || _a === void 0 ? void 0 : _a.prepare(t);
            }
        }
        this.inputs = newInputs;
        if (this.inputs.length === 0) {
            this.stop(0);
        }
    }
    get blockSize() {
        return this.samplesPerFrame * this.sampleArray.BYTES_PER_ELEMENT;
    }
    get currentTime() {
        return this.frameNumber * this.secondsPerFrame;
    }
    get bytesPerSecond() {
        return this.sampleRate * this.nChannels * this.sampleArray.BYTES_PER_ELEMENT;
    }
    connect(destination) {
        this.output = destination;
    }
    getRms() { }
    stop(second) {
        if (second === 0) {
            this.playing = false;
            this.emit("finish");
            this.inputs.forEach((input) => input.stop());
        }
        else {
            this.end = second;
        }
    }
    run() {
        while (true) {
            this.pump();
        }
    }
}
exports.SSRContext = SSRContext;
SSRContext.fromWAVFile = (path) => {
    return wav_header_1.readHeader(path);
};
SSRContext.fromFileName = (filename) => {
    const nChannels = filename.match(/\-ac(\d+)\-/) ? parseInt(filename.match(/\-ac(\d+)\-/)[1]) : 2;
    const sampleRate = (filename.match(/\-ar(\d+)\-/) && parseInt(filename.match(/\-ar(\d+)\-/)[1])) || 44100;
    const bitDepth = filename.includes("f32le") ? 32 : 16;
    return new SSRContext({
        sampleRate: sampleRate,
        nChannels: nChannels,
        fps: sampleRate / 128 / 50,
        bitDepth,
    });
};
SSRContext.defaultProps = {
    nChannels: 2,
    sampleRate: 44100,
    bitDepth: 16,
};
//# sourceMappingURL=ssrctx.js.map