export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource, BufferSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, format, resolve } from "path";
import { Application, Request, Response, Router } from "express";

import { createReadStream, readFile, readFileSync } from "fs";
import { convertMidi } from "./sequence";
import { frequencyToNote, midiToFreq } from "./soundkeys";

const express = require("express");
const app: Application = express();
app.use("*", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/play/:song.mp3", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/pcm",
    "Content-Disposition": "inline",
  });
  convertMidi("./song.mid", process.stdout, {
    mode: "realtime",
    interrupt: process.stdin,
    realtime: true,
  });
});

app.use("/midisf/:instrument/48000-mono-f32le-(:midi).pcm", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/pcm",
    "Content-Disposition": "inline",
  });
  createReadStream(
    `./midisf/${req.params.instrument}/48000-mono-f32le-${req.params.midi}.pcm`
  ).pipe(res);
});
const fpath = (uri) => resolve(__dirname, `../views`, uri);

app.use("/(:file).js", (req: Request, res: Response) => {
  console.log(req.params.file);
  res.sendFile(fpath(req.params.file + ".js"));
});
app.use("/", (req, res) => {
  const sections = execSync("ls -R -m midisf")
    .toString()
    .trim()
    .split("midisf/")
    .concat(
      execSync("ls -R -m samples/*pcm").toString().trim().split("samples/")
    );
  res.writeHead(200, { contentType: "text/html" });
  res.write("<html><body>");

  for (const section of sections) {
    const links = [];
    res.write("<div>");

    const [instrument, notes] = section.split(":");
    if (!instrument || !notes) continue;
    res.write("<h4>" + instrument + "</h4>");
    notes.split(", ").map((n) => {
      const nn = n.replace("48000-mono-f32le-", "").replace(".pcm", "");
      res.write(`<a href="/midisf/${instrument}/${n}"> 
        ${midiToFreq(nn)} - ${nn} </a>`);
    });
    res.write("</div>");
  }
  res.write(`<script>
  ${indexjs}
  </script>`);
  res.end("</body></html>");
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

// router.use("/", express.static(resolve(__dirname, "../views/")));
const cachedINdex = readFileSync("views/index.html")
  .toString()
  .split("<!-- data -->");

app.listen(3222, console.log);
const indexjs = ` 
document.querySelectorAll("a").forEach(a=>
  a.onclick= async (e)=>{
  const url = a.href; 
  e.preventDefault();
  globalThis.ctx = globalThis.ctx || new AudioContext();
  const ctx = globalThis.ctx;
  const dv = await fetch(url)
    .then((resp) => resp.blob())
    .then((blob) => blob.arrayBuffer())
    .then((ab) => new DataView(ab))
    .catch(console.log);

  if (!dv) return;
  const audb = ctx.createBuffer(1, dv.buffer.byteLength / 4, 48000);
  const buffer = audb.getChannelData(0);
  for (let i = 0; i < audb.length; i++) {
    buffer[i] = dv.getFloat32(i * 4, true);
  }
  const abs = new AudioBufferSourceNode(ctx, { buffer: audb });
  abs.connect(ctx.destination);
  abs.start();
})`;
