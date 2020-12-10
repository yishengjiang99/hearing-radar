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

export const RTServer = (config) => {
  const connections: WsSocket[] = [];
  return new Promise<WsServer>((resolve) => {
    const map = [];
    const ctx = SSRContext.fromFileName("-ac1-ar9000-s16le");
    //  ctx.on("data", console.log);
    ctx.on("data", (d) => {
      console.log(d);
      console.log([connections, ""].join("----------------"));
      connections.forEach((c: WsSocket) => {
        console.log("writing to ", c);
        c.write(d);
      });
    });
    const server = new WsServer(config);
    server.on("connection", (ws: WsSocket, req: IncomingMessage) => {
      connections.push(ws);
      ctx.on("data", (d) => ws.write(d));
      ws.on("data", (data) => onData(ws, data));
    });

    server.on("listening", () => resolve(server));
    server.start();
    ctx.start();

    const onData = (ws: WsSocket, data: Buffer) => {
      const request = data.toString().trim();
      console.log(data.toString());
      if (request.length == 1 && keyboardToFreq(request, 3) >= 0) {
        const osc = new Oscillator(ctx, {
          frequency: keyboardToFreq(request, 3),
        });
        osc.connect(ctx);
        osc.start();
      } else {
        console.log(request.toString());
      }
    };
  });
};

RTServer({ port: 5150 })
  .then((server) => {
    console.log(server);
  })
  .catch(console.error);
