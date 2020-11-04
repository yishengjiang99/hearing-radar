"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const audio_data_source_1 = require("./audio-data-source");
const ssrctx_1 = require("./ssrctx");
const stream_1 = require("stream");
const grep_transformers_1 = require("grep-transformers");
child_process_1.spawn("ls", "-R -m ./db".split(" "), {
    stdio: ["pipe", "pipe", "pipe"],
}).stdout.pipe(process.stdout);
child_process_1.spawn("ls", "-R -m ./db".split(" ")).on("error", console.error);
// .stdout.pipe(new ReadlineTransform())
// .pipe(new GraphLS())
// .pipe(
// 	new Transform({
// 		transform: (chunk, enc, cb) => {
// 			cb(null, JSON.stringify(chunk));
// 		},
// 	})
// )
// .pipe(process.stdout);
// .pipe(
// 	new Transform({
// 		transform: (chunk, enc, cb) => {
// 			cb(null, JSON.stringify(chunk));
// 		},
// 	})
// )
// .pipe(process.stdout);
process.exit();
const express = require("express");
var router = express.Router();
router.use("*", (req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    next();
});
router.use("/mp3", (req, res) => {
    const files = child_process_1.execSync("ls -R **/*.mp3").toString().trim().split(/\s+/);
    res.json(files);
    res.end();
});
router.get("/db", (req, res) => {
    child_process_1.spawn("ls", "-R -m db".split(" "))
        .stdout.pipe(new grep_transformers_1.ReadlineTransform())
        .pipe(new grep_transformers_1.GraphLS())
        .pipe(new stream_1.Transform({
        transform: (chunk, enc, cb) => {
            cb(null, JSON.stringify(chunk));
        },
    }))
        .pipe(res);
});
router.get("/file/:filename", (req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "inline",
    });
    const filename = req.url.replace("/file/", "");
    const ctx = new ssrctx_1.SSRContext({
        nChannels: 1,
        sampleRate: 44100,
        fps: 44100 / 128,
        bitDepth: 16,
    });
    ctx.connect(res);
    const fsrc = new audio_data_source_1.FileSource(ctx, {
        filePath: require("path").resolve(__dirname, "..", filename),
    });
    fsrc.connect(ctx);
    ctx.start();
});
if (require.main === module) {
    const app = express();
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
//# sourceMappingURL=server.js.map