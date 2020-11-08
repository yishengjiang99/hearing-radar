export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, resolve } from "path";
import { PassThrough, Transform } from "stream";
import { createInterface } from "readline";
import { get } from "https";
import {
	Application,
	Request,
	RequestParamHandler,
	Response,
	Router,
} from "express";
import {
	ReadlineTransform,
	LSGraph,
	LSSource,
	MemoryWritable,
} from "grep-transform";
import { createReadStream, exists, existsSync, readFileSync } from "fs";
import { create } from "domain";

let files = [
	"synth/440/-ac2-f32le",
	"synth/440/-ac2-s16le",
	...execSync("ls samples/*pcm").toString().trim().split(/\s+/),
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
	res.writeHead(200, {
		"Access-Control-Allow-Origin": "*",
		"Content-Type": "application/octet-stream",
		"Content-Disposition": "inline",
	});
	const ctx = SSRContext.fromFileName(filename);

	ctx.connect(res);
	const fsrc = new FileSource(ctx, {
		filePath: filename,
	});
	fsrc.connect(ctx);
	ctx.start();
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
