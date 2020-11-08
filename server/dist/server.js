"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const child_process_1 = require("child_process");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const path_1 = require("path");
const grep_transform_1 = require("grep-transform");
const fs_1 = require("fs");
let files = [
    "synth/440/-ac2-f32le",
    "synth/440/-ac2-s16le",
    ...child_process_1.execSync("ls samples/*pcm").toString().trim().split(/\s+/),
];
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
exports.router.get("/samples/:filename", (req, res) => {
    const filename = path_1.resolve(__dirname, "../samples/", req.params.filename);
    if (!fs_1.existsSync(filename)) {
        res.writeHead(404);
        return;
    }
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "inline",
    });
    const ctx = ssrctx_1.SSRContext.fromFileName(filename);
    ctx.connect(res);
    const fsrc = new audio_data_source_1.FileSource(ctx, {
        filePath: filename,
    });
    fsrc.connect(ctx);
    ctx.start();
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
    ctx.start();
});
exports.router.use("/app", express.static("../../public"));
exports.router.use((req, res) => {
    const fpath = path_1.resolve(__dirname, `../../public/${req.url}`);
    if (req.url === "/") {
        res.end(`
		<html>
		<head>
		<style>${fs_1.readFileSync("../public/style.css")}</style>
		</head>
		<body>
		<div id='container'>
			<div id='menu'>
			${files.map((file) => `<li><a href='${file}'>${file}</a></li>`).join("<br>")}
			</div>
			<div id='rx1'>panel</div>				
			<div id='stdout'>
		
			</div>
			<div id='cp'><button>btn<button></div>
			<input size=80 autofocus />	
			</div>
		</div>

		<script src='build/Main.js'>
		</script>
		</body>
		</html>
		`);
    }
    else if (fs_1.existsSync(fpath)) {
        res.contentType(require("mime").lookup(path_1.basename(fpath)));
        res.sendFile(fpath);
    }
    else {
        res.end(path_1.resolve(__dirname, `../../public/${req.url}`));
    }
});
if (require.main === module) {
    const app = express();
    app.engine("tag", function (filename, options, callback) {
        function toks(str, ...args) { }
    });
    app.use("/node", exports.router);
    app.use("/", exports.router);
    app.listen(3000);
}
// const p = spawn("ls", ["-R", "./db"]);
// p.stdout.pipe(process.stdout);
// p.on("error", console.error);
// })
// 		res.writeHead(200, {
// 			"Access-Control-Allow-Origin": "*",
// 			"Content-Type": "application/octet-stream",
// 			"Content-Disposition": "inline",
// 		});
// 		const filename = req.url.replace("/file/", "");
// 		const ctx = new SSRContext({
// 			nChannels: 1,
// 			sampleRate: 44100,
// 			fps: 44100 / 128,
// 			bitDepth: 16,
// 		});
// 		ctx.connect(res);
// 		const fsrc = new FileSource(ctx, {
// 			filePath: require("path").resolve(__dirname, "..", filename),
// 		});
// 		fsrc.connect(ctx);
// 		ctx.start();
// 	}
// });
// // });
// // WebSocketServer({
// // 	onConnection: (reply, session, socket) => {
// // 		const ctx = new SSRContext({
// // 			nChannels: 2,
// // 			sampleRate: 44100,
// // 			fps: 100,
// // 			bitDepth: 32,
// // 		});
// // 		const pt = new PassThrough();
// // 		ctx.connect(pt);
// // 		ctx.start();
// // 		const fsrc = new FileSource(ctx, {
// // 			filePath: inc.replace("file:", ""),
// // 		});
// // 		fsrc.connect(ctx);
// // 		reply(samples.join("|"));
// // 	},
// // 	onData: (data: Buffer, reply, session, socket) => {
// // 		const inc = data.toString();
// // 		const ctx = session["ctx"];
// // 		const pt = session["pt"];
// // 		if (inc.startsWith("file:")) {
// // 			const fsrc = new FileSource(ctx, {
// // 				filePath: inc.replace("file:", ""),
// // 			});
// // 			fsrc.connect(ctx);
// // 			pt.on("data", (d) => reply(d));
// // 		} else if (inc === "stop") {
// // 			ctx.stop();
// // 		} else if (inc === "start") {
// // 			ctx.start();
// // 		}
// // 	},
// // 	port: 5150,
// // });
// // const b = require("fs").readFileSync("./samples/2L.pcm");
// // for (let i = 0; i < b.length; i += 4) {
// // 	const f2 = b.readFloatLE(i);
// // 	const n = b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);
// // 	let f;
// // 	if (b[i + 3] & 0x80) {
// // 		f = -(0x100000000 - n) / 0x80000000;
// // 	} else {
// // 		f = n / 0x7fffffff;
// // 	}
// // 	console.log(f2, f);
// // }
//# sourceMappingURL=server.js.map