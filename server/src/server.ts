export {};
import { PassThrough } from "stream";
import WebSocket, * as ws from "ws";
import { Oscillator } from "./AudioDataSource";
import { SSRContext } from "./ssrctx";
const server = new ws.Server({
	port: 5150,
});
server.on("connection", (ws: WebSocket) => {
	const ctx = new SSRContext({ nChannels: 2, sampleRate: 44100, fps: 22050 });
	const osc = new Oscillator(ctx, { frequency: 440 });
	const pt = new PassThrough();
	ctx.connect(pt);
	osc.connect(ctx);
	pt.on("data", (d) => ws.send(d));
});
