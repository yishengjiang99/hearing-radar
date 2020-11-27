"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTServer = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const grep_wss_1 = require("grep-wss");
const path_1 = require("path");
const midi_buffer_source_1 = require("./midi-buffer-source");
const audio_data_source_1 = require("./audio-data-source");
const soundkeys_1 = require("./soundkeys");
const ssrctx_1 = require("./ssrctx");
const midfiles = path_1.resolve(__dirname, "../csv");
const files = child_process_1.execSync(`ls ${midfiles}`).toString().split("\n");
exports.RTServer = (config) => {
    return new Promise((resolve) => {
        const map = [];
        const ctx = ssrctx_1.SSRContext.fromFileName("-ac1-ar9000-s16le");
        const server = new grep_wss_1.WsServer(config);
        server.on("connection", (ws, req) => {
            ctx.on("data", (d) => ws.write(d));
            ws.socket.on("data", (data) => onData(ws, data));
            ws.write(child_process_1.execSync(`ls ${midfiles}`).toString());
        });
        server.on("listening", () => resolve(server));
        server.start();
        const onData = (ws, data) => {
            const request = data.toString().trim();
            if (fs_1.existsSync(`${midfiles}/${request}`)) {
                midi_buffer_source_1.playCsv(ctx, `${midfiles}/${request}`, "");
            }
            if (request.length == 1 && soundkeys_1.keyboardToFreq(request, 3) >= 0) {
                const osc = new audio_data_source_1.Oscillator(ctx, {
                    frequency: soundkeys_1.keyboardToFreq(request, 3),
                });
                osc.connect(ctx);
                osc.start();
            }
        };
    });
};
exports.RTServer({ port: 5150 });
//# sourceMappingURL=rtmp.js.map