"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.U32toF32 = exports.router = void 0;
const child_process_1 = require("child_process");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const path_1 = require("path");
const grep_transform_1 = require("grep-transform");
const fs_1 = require("fs");
let files = ["synth/440/-ac2-f32le.wav", "synth/440/-ac2-s16le.wav", ...child_process_1.execSync("ls samples/*pcm").toString().trim().split(/\s+/)];
const express = require("express");
exports.router = express.Router();
exports.router.use("*", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    next();
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
        .pipe(new grep_transform_1.LSGraph())
        .on("data", (d) => {
        res.write(d.toString());
    })
        .on("end", () => res.end());
});
function U32toF32(i) {
    if (i === 0)
        return 0;
    let r = i & ((1 << 23) - 1);
    1;
    r /= 1 << 23;
    r += 1.0;
    const bias = 127;
    let shift = ((i >> 23) & 0xff) - bias;
    for (; shift > 0; shift--)
        r *= 2;
    for (; shift < 0; shift++)
        r /= 2;
    return r;
}
exports.U32toF32 = U32toF32;
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
exports.router.use("/", (req, res) => {
    const fpath = path_1.resolve(__dirname, `../../public/${req.url}`);
    res.end(`
		<html>
		<head>
		</head>
		<body>
		<div id='container'>
			<div id='menu'>
				${files.map((f) => `<li><button href='${f}'>${path_1.basename(f)}</button><li>`).join("")}
			</div>

			<div id='stdout'></div>
			<input type='file' value='sele'>input</input>
			<input size=80 autofocus ></input>
		</div>
		<div id='rx'>
			<div id='rx1'></div>
			<div id='rx2'></div>
		</div>
    <script src='./build/esm/templateUI.js' type='module'>
    
		</script>
		</body>
		</html>
		`);
});
if (require.main === module) {
    const app = express();
    app.engine("tag", function (filename, options, callback) {
        function toks(str, ...args) { }
    });
    app.use("/node", exports.router);
    app.use("/", exports.router);
    app.listen(3000);
    setInterval(() => {
        console.log(process.memoryUsage());
    }, 20200);
}
//# sourceMappingURL=server.js.map