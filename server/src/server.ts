export {};
import { PassThrough } from "stream";
import WebSocket, * as ws from "ws";
import { Oscillator } from "./AudioDataSource";
import { SSRContext } from "./ssrctx";
import { IncomingMessage } from "http";
const server = new ws.Server({
	port: 5150,
});
const ctx: { [key: string]: SSRContext } = {};
const sessionId = (request: IncomingMessage) => {
	return request.headers["sec-websocket-key"];
};

server.on("connection", (ws: WebSocket, request: IncomingMessage) => {
	console.log("connection");
	ctx[sessionId(request)] = new SSRContext({
		nChannels: 1,
		sampleRate: 9000,
		fps: 9000 / 128 / 16,
	});
	let _ctx = ctx[sessionId(request)];
	const osc = new Oscillator(_ctx, { frequency: 440 });
	const pt = new PassThrough();
	_ctx.connect(pt);
	osc.connect(_ctx);
	pt.on("data", (d) => ws.send(d));
	_ctx.start();
	ws.on("message", (ws, data) => {
		if (data === "start" && !_ctx.playing) _ctx.start();
		if (data === "stop") _ctx.stop();
	});
});
server.on("close", (socket: WebSocket, request: IncomingMessage) => {
	ctx[sessionId(request)].stop();
	ctx[sessionId(request)] = null;
});
