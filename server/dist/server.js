"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const child_process_1 = require("child_process");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const path_1 = require("path");
const grep_transform_1 = require("grep-transform");
const fs_1 = require("fs");
const pcm_1 = require("./pcm");
let files = ["synth/440/-ac2-f32le.wav", "synth/440/-ac2-s16le.wav"];
const express = require("express");
const viewEngine = require("html");
exports.router = express.Router();
exports.router.use("*", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    next();
});
exports.router.use("/midi", (req, res) => {
    pcm_1.listFiles("midi");
    res.render("playlist", { rs: pcm_1.listFiles }, (err, html) => {
        if (err)
            res.end(err.message);
        else
            res.end(html);
    });
});
exports.router.use("/mp3", (req, res) => {
    const files = child_process_1.execSync("ls -R **/*.mp3").toString().trim().split(/\s+/);
    res.json(files);
    res.end();
});
exports.router.get("/r", (req, res) => {
    res.status(200);
    res.contentType("text/html");
    grep_transform_1.LSSource(path_1.resolve(__dirname, "../db"))
        .pipe(new grep_transform_1.ReadlineTransform())
        .pipe(new grep_transform_1.LSGraph("."))
        .on("data", (d) => {
        res.write(d.toString());
    })
        .on("end", () => res.end());
});
exports.router.get("/play", (req, res) => {
    return res.render("index.html");
});
exports.router.get("/samples/:filename", (req, res) => {
    const filename = path_1.resolve(__dirname, "../samples/", req.params.filename);
    if (!fs_1.existsSync(filename)) {
        res.writeHead(404);
        return;
    }
    const ctx = ssrctx_1.SSRContext.fromWAVFile(filename);
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "audio/x-wav",
        "x-sample-rate": ctx.sampleRate,
        "x-bit-depth": ctx.bitDepth,
        "x-n-channel": ctx.nChannels,
    });
    ctx.fps = 10;
    ctx.connect(res);
    const fsrc = new audio_data_source_1.FileSource(ctx, {
        filePath: filename,
    });
    fsrc.connect(ctx);
    ctx.start();
    res.on("close", () => ctx.stop());
    req.socket.on("close", () => ctx.stop());
});
exports.router.get("/synth/:freq/:desc.wav", (req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "x-audio/WAVE",
    });
    const ctx = ssrctx_1.SSRContext.fromFileName(req.params.desc);
    const osc = new audio_data_source_1.Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
    res.write(osc.header);
    osc.connect(ctx);
    ctx.connect(res);
    ctx.on("end", () => {
        res.end();
    });
    ctx.start();
    ctx.stop(2);
});
exports.router.get("/db/:dir/:file", (req, res) => {
    const path = path_1.resolve("db", req.params.dir, req.params.file);
    res.end(path);
});
exports.router.get("/synth/:freq/:desc", (req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "inline",
    });
    const ctx = ssrctx_1.SSRContext.fromFileName(req.params.desc);
    const osc = new audio_data_source_1.Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
    osc.connect(ctx);
    ctx.connect(res);
    ctx.on("end", () => {
        res.end();
    });
    ctx.start();
    ctx.stop(2);
});
const fpath = (uri) => path_1.resolve(__dirname, `../../radar/public/${uri}`);
exports.router.use("/build/:file", (req, res) => {
    console.log(req.params.file);
    res.sendFile(fpath("build/" + req.params.file));
});
exports.router.use("/", express.static(path_1.resolve(__dirname, "../views/")));
if (require.main === module) {
    const app = express();
    const compiler = require("express-react-forked");
    app.set("views", require("path").resolve(__dirname, "../views"));
    app.set("view engine", "jsx");
    app.engine("jsx", compiler());
    app.use("/node", exports.router);
    app.use("/", exports.router);
    app.listen(3000);
    setInterval(() => {
        console.log(process.memoryUsage());
    }, 20200);
}
//# sourceMappingURL=server.js.map