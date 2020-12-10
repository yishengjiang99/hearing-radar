export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource, BufferSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, format, resolve } from "path";
import { Application, Request, Response, Router } from "express";
import { ReadlineTransform, LSGraph, LSSource } from "grep-transform";
import { createReadStream, readFile, readFileSync } from "fs";
import { convertMidi } from "./sequence";
import { listContainerFiles, listFilesSync } from "./azblob/list-blobs";
import { Readable, Writable } from "stream";
import { wsclient } from "./azblob";
import { wavHeader, wavHeader32 } from "./wav-header";

let files = [
  "synth/440/-ac2-f32le.wav",
  "synth/440/-ac2-s16le.wav",
  "samples/billie-ac2-ar-44100-s16le.pcm",
];
const express = require("express");
const app: Application = express();
app.use("*", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/play/:name", (req, res) => {
  const size = 4096;
  let offset = 0;
  const ctx = SSRContext.fromFileName(req.params.filename);
  ctx.connect(res);
});
app.use("/midi/:name", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/csv",
    "Content-Disposition": "inline",
  });
  res.flushHeaders();
  // req.on("end", () => res.end());
  await convertMidi("./song.mid", res, {
    interrupt: req,
    realtime: true,
  });
  res.end();
});

app.use("/note/:midi/:instrument.pcm", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/pcm",
    "Content-Disposition": "inline",
  });
  let ms;

  const tt = req.query.t || 1;
  const start = (parseInt(req.params.midi) - 21) * 433840;
  const end = start + 44100 * 4 * 2 * parseFloat(tt as string);
  res.write(Buffer.from(wavHeader32(end - start)));
  const length = createReadStream(
    `./midisf/${req.params.instrument}/48000-mono-f32le-44-${req.params.midi}.pcm`,
    {
      start,
      end,
    }
  ).pipe(res);
});
app.use("/chord/:midi1/:midi2/:midi3/:instrument.mp3", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/mp3",
    "Content-Disposition": "inline",
  });
  const { midi1, midi2, midi3 } = req.params;
  const inputStr = [midi1, midi2, midi3]
    .map((midi) => `-i db/${req.params.instrument}/${midi}.mp3`)
    .join(" ");
  const filterStr = `-filter_complex amix=inputs=3`;
  const duration = req.query.t || 2;
  const cmd = `-y -hide_banner -loglevel panic ${inputStr} ${filterStr} -t ${duration} -f mp3 pipe:1`;
  spawn("ffmpeg", cmd.split(" ")).stdout.pipe(res);
});

app.get("/samples/:filename", (req, res) => {
  const ctx = SSRContext.fromFileName(req.params.filename);
  const play = spawn("ffplay", "-i pipe:0 -ac 2 -ar 44100 -f s16le".split(" "))
    .stdin;
  ctx.on("data", (d) => {
    play.write(d);
  }); //(play); //spawn('ffplay',`-i pipe:0 -ac 2 -ar 4410 -f s16le`.split(' '))))
  ctx.start();
});
app.get("/synth/:freq/:desc.wav", (req, res) => {
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

app.get("/synth/:freq/:desc", (req, res) => {
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
const fpath = (uri) => resolve(__dirname, `../views`, uri);

app.use("/(:file).js", (req: Request, res: Response) => {
  console.log(req.params.file);
  res.sendFile(fpath(req.params.file + ".js"));
});
// router.use("/", express.static(resolve(__dirname, "../views/")));
const cachedINdex = readFileSync("views/index.html")
  .toString()
  .split("<!-- data -->");

const writeSync = async (ws: Writable, str: string) => {
  new Promise((resolve) => ws.write(str, resolve));
};
const pipeSync = async (ws: Writable, rs: Readable) => {
  new Promise((resolve) => {
    rs.pipe(ws, { end: false });
    rs.on("end", resolve);
  });
};
app.use("/", async (req: Request, res: Response) => {
  listContainerFiles("pcm").pipe(res);
});

app.listen(3222, console.log);
