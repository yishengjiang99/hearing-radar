import { spawn } from "child_process";
import { promises, read } from "fs";
import { wscat, WsServer, WsSocket } from "grep-wss";
import { IncomingMessage } from "http";
import { resolve } from "path";
import { Interface } from "readline";
import { PassThrough } from "stream";
import { Oscillator } from "./audio-data-source";
import { keyboardToFreq } from "./soundkeys";
import { SSRContext } from "./ssrctx";
export function RTServer(
	config = {
		port: 3002,
	}
): Promise<WsServer> {
	return new Promise((resolve) => {
		const server = new WsServer(config);
		server.on("connection", (ws: WsSocket, req: IncomingMessage) => {
			const ctx = new SSRContext({
				bitDepth: 16,
				nChannels: 1,
			});
			ctx.connect(ws.socket);
			let oscs = [];
			ws.socket.on("data", (d) => {
				console.log(d.toString().trim());
				const request = d.toString().trim();
				if (request.length == 1 && keyboardToFreq(request, 3) >= 0) {
					const osc = new Oscillator(ctx, {
						frequency: keyboardToFreq(request, 3),
					});
					osc.start();
				}
				ctx.start();
				ctx.on("data", (d) => ws.write(d));
			});
		});
		server.on("listening", (msg) => resolve(server));
		server.start();
	});
}

RTServer({
	port: 3000,
});
`	_fifo,
_fifo_init,
_fifo_size,
_fifo_read,
_fifo_prelloc,
_fifo_write,
_fifo_free,
_fetch_connect,
_fetch_url`.split(/,\n\s+/);
