"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const grep_wss_1 = require("grep-wss");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const samples = require("child_process")
    .execSync("ls samples")
    .toString()
    .trim()
    .split(/\s+/)
    .map((f) => "./samples/" + f);
grep_wss_1.WebSocketServer({
    onConnection: (reply, session, socket) => {
        const ctx = new ssrctx_1.SSRContext({
            nChannels: 2,
            sampleRate: 44100,
            fps: 100,
            bitDepth: 32,
        });
        const pt = new stream_1.PassThrough();
        ctx.connect(pt);
        ctx.start();
        pt.on("data", (d) => reply(d));
        session["ctx"] = ctx;
        session["pt"] = pt;
        session.set("pt", pt);
        reply(samples.join("|"));
    },
    onData: (data, reply, session) => {
        const inc = data.toString();
        const ctx = session["ctx"];
        const pt = session["pt"];
        if (inc.startsWith("file:")) {
            const fsrc = new audio_data_source_1.FileSource(ctx, {
                filePath: inc.replace("file:", ""),
            });
            fsrc.connect(ctx);
            pt.on("data", (d) => reply(d));
        }
        else if (inc === "stop") {
            ctx.stop();
        }
        else if (inc === "start") {
            ctx.start();
        }
    },
    port: 5150,
});
//# sourceMappingURL=server.js.map