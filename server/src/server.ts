export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, resolve } from "path";
import { Application, Request, Response, Router } from "express";
import { ReadlineTransform, LSGraph, LSSource } from "grep-transform";
import {
	createReadStream,
	createWriteStream,
	exists,
	existsSync,
	readFileSync,
} from "fs";
import {
	handleWsRequest,
	WebSocketServer,
	wscat,
	WsServer,
	WsSocket,
} from "grep-wss";
import { PassThrough } from "stream";
import { wavHeader } from "./wav-header";
let files = [
	"synth/440/-ac2-f32le",
	"synth/440/-ac2-s16le",
	...execSync("ls samples/*wav").toString().trim().split(/\s+/),
];
const uuid = () => process.hrtime().join("|");
const express = require("express");
export const router: Router = express.Router();
router.use("*", (req, res, next) => {
	res.set("Access-Control-Allow-Origin", "*");
	next();
});

router.use("/mp3", (req, res) => {
	const files = execSync("ls -R **/*.mp3").toString().trim().split(/\s+/);
	res.json(files);
	res.end();
});
router.get("/r", (req, res: Response) => {
	res.status(200);
	res.contentType("text/html");

	LSSource(resolve(__dirname, "../db"))
		.pipe(new ReadlineTransform())
		.pipe(new LSGraph())
		.on("data", (d) => {
			res.write(d.toString());
		})
		.on("end", () => res.end());
});
router.get("/samples/:filename", (req, res) => {
	const filename = resolve(__dirname, "../samples/", req.params.filename);
	if (!existsSync(filename)) {
		res.writeHead(404);
		return;
	}
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "audio/x-wav",
	});
	// createReadStream(filename).pipe(res);
	// return;

	const ctx = SSRContext.fromFileName(filename);
	// res.write(Buffer.from(wavHeader(44100 * 2 * 30, 44100, 2)));
	ctx.fps = 10;
	ctx.connect(res);
	const fsrc = new FileSource(ctx, {
		filePath: filename,
	});
	fsrc.connect(ctx);
	ctx.start();

	res.on("close", () => ctx.stop());
	req.socket.on("close", () => ctx.stop());
});
router.get("/synth/:freq/:desc.wav", (req, res) => {
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "audio/WAVE",
	});
	const ctx = SSRContext.fromFileName(req.params.desc);
	console.log(ctx.bitDepth, Buffer.from(ctx.WAVHeader).buffer);
	const osc = new Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
	osc.connect(ctx);
	ctx.connect(res);
	ctx.on("end", () => {
		res.end();
	});
	ctx.start();
	ctx.stop(500);
});
router.get("/synth/:freq/:desc", (req, res) => {
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/octet-stream",
		"Content-Disposition": "inline",
	});
	const ctx = SSRContext.fromFileName(req.params.desc);
	console.log(ctx.bitDepth, Buffer.from(ctx.WAVHeader).buffer);
	const osc = new Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
	osc.connect(ctx);
	ctx.connect(res);
	ctx.start();
});
router.use("/app", express.static("../../public"));
router.use((req: Request, res: Response) => {
	const fpath = resolve(__dirname, `../../public/${req.url}`);
	if (req.url === "/") {
		res.end(`
		<html>
		<head>
		<style>${readFileSync("../public/style.css")}</style>
		</head>
		<body>
		<div id='container'>
			<div id='menu'>
				${files
					.map(
						(f) =>
							`<li><button href='${f}'>${basename(
								f
							)}</button><li>`
					)
					.join("")}
			</div>
			<audio controls src='synth/440/-ac2-f32le.wav'></audio>

			<div id='stdout'></div>
			<input type='file' value='sele'>input</input>
			<input size=80 autofocus ></input>
		</div>
		<div id='rx'>
			<div id='rx1'></div>
			<div id='rx2'></div>
		</div>
		<script src='./build/main.js'>
		</script>
		</body>
		</html>
		`);
	} else if (existsSync(fpath)) {
		res.contentType(require("mime").lookup(basename(fpath)));
		res.sendFile(fpath);
	} else {
		res.end(resolve(__dirname, `../../public/${req.url}`));
	}
});
if (require.main === module) {
	const app: Application = express();
	app.engine("tag", function (filename, options, callback) {
		function toks(str: TemplateStringsArray, ...args) {}
	});
	app.use("/node", router);
	app.use("/", router);

	const http = require("http").createServer(app);
	http.listen(3000);
	console.log(uuid());
	handleWsRequest(http, (uri: string) => {
		if (uri.match(/upload(.*?)/)) {
			console.log("");
			return (connection: WsSocket) => {
				const wstr = createWriteStream("/tmp/" + uuid() + ".raw");
				const SSRCtx = SSRContext.fromFileName(uri);
				connection.write("ack");
				wstr.write(new Uint8Array(SSRCtx.WAVHeader));
				connection.on("data", (d) => {
					console.log(d.byteLength);
					wstr.write(d);
				});
			};
		} else if (uri.match(/synth\/\(d\)/)) {
			return (connection: WsSocket) => {
				const m = uri.match(/synth\/\(d\)/);
				const ctx = new SSRContext({
					nChannels: 1,
					sampleRate: 9000,
					fps: 10,
					bitDepth: 16,
				});
				const pt = new PassThrough();
				const fsrc = new Oscillator(ctx, {
					frequency: m[1],
				});
				fsrc.connect(ctx);
				ctx.start();
				ctx.connect(pt);
				pt.on("data", (d) => connection.write(d));
			};
		} else if (uri.match(/pcm\/\(d\)/)) {
			return (connection: WsSocket) => {
				const ctx = new SSRContext({
					nChannels: 1,
					sampleRate: 9000,
					fps: 10,
					bitDepth: 16,
				});
				const pt = new PassThrough();
				const fsrc = new FileSource(ctx, {
					filePath: uri.replace("file:", ""),
				});
				fsrc.connect(ctx);
				ctx.start();
				ctx.connect(pt);
			};
		} else {
			return () => {};
		}
	});
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
