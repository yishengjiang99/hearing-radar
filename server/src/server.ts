export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, resolve } from "path";
import { Application, Request, Response, Router } from "express";
import { ReadlineTransform, LSGraph, LSSource } from "grep-transform";
import { existsSync, readFileSync } from "fs";

let files = [
	"synth/440/-ac2-f32le.wav",
	"synth/440/-ac2-s16le.wav",
	...execSync("ls samples/*wav").toString().trim().split(/\s+/),
];
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

	const ctx = SSRContext.fromWAVFile(filename);
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "audio/x-wav",
		"x-sample-rate": ctx.sampleRate,
		"x-bit-depth": ctx.bitDepth,
		"x-n-channel": ctx.nChannels,
	});
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
		"Content-Type": "x-audio/WAVE",
	});
	const ctx = SSRContext.fromFileName(req.params.desc);
	const osc = new Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
	res.write(osc.header);
	osc.connect(ctx);
	ctx.connect(res);
	ctx.on("end", () => {
		res.end();
	});
	ctx.start();
	ctx.stop(2);
});
router.get("/synth/:freq/:desc", (req, res) => {
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/octet-stream",
		"Content-Disposition": "inline",
	});
	const ctx = SSRContext.fromFileName(req.params.desc);
	const osc = new Oscillator(ctx, { frequency: parseFloat(req.params.freq) });
	osc.connect(ctx);
	ctx.connect(res);
	ctx.on("end", () => {
		res.end();
	});
	ctx.start();
	ctx.stop(2);
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
	app.listen(3000);
	setInterval(() => {
		console.log(process.memoryUsage());
	}, 2000);
}
