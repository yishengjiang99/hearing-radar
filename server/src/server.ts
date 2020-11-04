export {};
import { PassThrough } from "stream";
import { WebSocketServer } from "grep-wss";

import { Oscillator, FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { IncomingMessage, createServer, ServerResponse } from "http";
const samples = require("child_process")
	.execSync("ls samples")
	.toString()
	.trim()
	.split(/\s+/)
	.map((f) => "samples/" + f);

createServer((req: IncomingMessage, res: ServerResponse) => {
	if (req.url === "/") {
		res.writeHead(200, {
			"Access-Control-Allow-Origin": "*",
		});
		res.end(samples.join("|"));
	} else if (req.url.startsWith("/file")) {
		res.writeHead(200, {
			"Access-Control-Allow-Origin": "*",
			"Content-Type": "application/octet-stream",
			"Content-Disposition": "inline",
		});
		const filename = req.url.replace("/file/", "");
		// require("fs")
		// 	.createReadStream(
		// 		require("path").resolve(__dirname, "..", filename)
		// 	)
		// 	.pipe(res);
		const ctx = new SSRContext({
			nChannels: 1,
			sampleRate: 44100,
			fps: 44100 / 128,
			bitDepth: 16,
		});
		ctx.connect(res);
		const fsrc = new FileSource(ctx, {
			filePath: require("path").resolve(__dirname, "..", filename),
		});
		fsrc.connect(ctx);
		ctx.start();
	}
}).listen(4000);
// });

// WebSocketServer({
// 	onConnection: (reply, session, socket) => {
// 		const ctx = new SSRContext({
// 			nChannels: 2,
// 			sampleRate: 44100,
// 			fps: 100,
// 			bitDepth: 32,
// 		});
// 		const pt = new PassThrough();
// 		ctx.connect(pt);
// 		ctx.start();
// 		const fsrc = new FileSource(ctx, {
// 			filePath: inc.replace("file:", ""),
// 		});
// 		fsrc.connect(ctx);
// 		reply(samples.join("|"));
// 	},
// 	onData: (data: Buffer, reply, session, socket) => {
// 		const inc = data.toString();
// 		const ctx = session["ctx"];
// 		const pt = session["pt"];
// 		if (inc.startsWith("file:")) {
// 			const fsrc = new FileSource(ctx, {
// 				filePath: inc.replace("file:", ""),
// 			});
// 			fsrc.connect(ctx);
// 			pt.on("data", (d) => reply(d));
// 		} else if (inc === "stop") {
// 			ctx.stop();
// 		} else if (inc === "start") {
// 			ctx.start();
// 		}
// 	},
// 	port: 5150,
// });
// const b = require("fs").readFileSync("./samples/2L.pcm");
// for (let i = 0; i < b.length; i += 4) {
// 	const f2 = b.readFloatLE(i);
// 	const n = b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24);
// 	let f;
// 	if (b[i + 3] & 0x80) {
// 		f = -(0x100000000 - n) / 0x80000000;
// 	} else {
// 		f = n / 0x7fffffff;
// 	}
// 	console.log(f2, f);
// }
