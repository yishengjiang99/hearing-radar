import { spawn } from "child_process";
import { promises, read } from "fs";
import { wscat, WsServer, WsSocket } from "grep-wss";
import { IncomingMessage } from "http";
import { Oscillator } from "./audio-data-source";
import { keyboardToFreq } from "./soundkeys";
import { SSRContext } from "./ssrctx";
export const RTServer = (config) => {
	return new Promise<WsServer>((resolve) => {
		const map = [];
		const ctx = SSRContext.fromFileName("-ac1-ar9000-f32le");
		const server = new WsServer(config);
		server.on("connection", (ws: WsSocket, req: IncomingMessage) => {
			ws.socket.on("data", (data) => onData(ws, data));
		});
		server.on("listening", () => resolve(server));
		server.start();

		const onData = (ws: WsSocket, data: Buffer) => {
			const request = data.toString().trim();
			if (request.length == 1 && keyboardToFreq(request, 3) >= 0) {
				const osc = new Oscillator(ctx, {
					frequency: keyboardToFreq(request, 3),
				});
				osc.start();
			}
		};
	});
};
