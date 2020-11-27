import { execSync, spawn } from "child_process";
import { existsSync, promises, read, readdirSync } from "fs";
import { wscat, WsServer } from "grep-wss";
import { IncomingMessage } from "http";
import { resolve } from "path";
import { playCsv } from "./midi-buffer-source";
import { Oscillator } from "./audio-data-source";
import { keyboardToFreq } from "./soundkeys";
import { SSRContext } from "./ssrctx";
import { WsSocket } from "grep-wss/dist/WsSocket";
const midfiles = resolve(__dirname, "../csv");

const files = execSync(`ls ${midfiles}`).toString().split("\n");
// const csvs = readdirSync(midfiles).map((file) => loadMidi(file, file + ".csv"));
export const RTServer = (config) => {
  return new Promise<WsServer>((resolve) => {
    const map = [];
    const ctx = SSRContext.fromFileName("-ac1-ar9000-s16le");
    const server = new WsServer(config);
    server.on("connection", (ws: WsSocket, req: IncomingMessage) => {
      ctx.on("data", (d) => ws.write(d));
      ws.socket.on("data", (data) => onData(ws, data));
      ws.write(execSync(`ls ${midfiles}`).toString());
    });
    server.on("listening", () => resolve(server));
    server.start();

    const onData = (ws: WsSocket, data: Buffer) => {
      const request = data.toString().trim();
      if (existsSync(`${midfiles}/${request}`)) {
        playCsv(ctx, `${midfiles}/${request}`, "");
      }

      if (request.length == 1 && keyboardToFreq(request, 3) >= 0) {
        const osc = new Oscillator(ctx, {
          frequency: keyboardToFreq(request, 3),
        });
        osc.connect(ctx);
        osc.start();
      }
    };
  });
};

RTServer({ port: 5150 });
