export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource, BufferSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, format, resolve } from "path";
import { Application, Request, Response, Router } from "express";
import {
  ReadlineTransform,
  LSGraph,
  LSSource,
  MemoryWritable,
} from "grep-transform";
import { createReadStream, readFile, readFileSync } from "fs";
import { convertMidi } from "./sequence";

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

app.use("/play/:song.mp3", (req, res) => {
  req.headers.get("if-range") !== null;
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/pcm",
    "Content-Disposition": "inline",
  });

  convertMidi("./song.mid", converMp3.stdin, {
    interrupt: process.stdin,
    realtime: true,
  });
  converMp3.stdout.pipe(res);
});

app.use("/midisf/:instrument/48000-mono-f32le-(:midi).pcm", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/pcm",
    "Content-Disposition": "inline",
  });
  let ms;

  const tt = req.query.t || 1;

  createReadStream(
    `./midisf/${req.params.instrument}/48000-mono-f32le-${req.params.midi}.pcm`
  ).pipe(res);
});

app.use("/", (req, res) => {
  res.writeHead(200, {
    "content-type": "text/html",
  });
  res.end(
    `<html><body>
      <script>

          const play = async (url)=>{
            window.ctx = window.ctx || new AudioContext();
            const  dv=await fetch(url,{
              headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/pdf'
              },
              responseType: "blob"
          }).then(resp=>resp.blob()).then(blob=>blob.arrayBuffer()).then(ab=>new DataView(ab)).catch(console.log)

              const audb = ctx.createBuffer(1, dv.buffer.byteLength/4, 48000);
              const buffer =audb.getChannelData(0);
             for(let i=0; i<audb.length;i++){
                buffer[i]=dv.getFloat32(i*4,true);
              }
              const abs = new AudioBufferSourceNode(ctx, {buffer:audb});
              abs.connect(ctx.destination);
              abs.start();
            
          }
      </script>
      ${execSync("ls -Rm midisf/*/*.pcm")
        .toString()
        .trim()
        .split("\n\n")
        .map((section) => {
          if (!section) return;
          console.log(section);
          const [instrument, notes] = section.split(":");
          if (!notes) return;
          return `<h4>${instrument}<h4>
          <div>${
            `` +
            notes
              .split(" ")
              .map((f) => {
                return `<button><a onclick='play("${f}")'>
              ${f.split("-").pop().split(".pcm")[0]}</a>
              </button>`;
              })
              .join(" ")
          }</div>`;
        })}
        <playlist>
       <a href='${req.originalUrl.split("/")[0]}/play/song.mid'>Play MIDI</a>
        </playlist>
          
      </body></html>`
  );
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
// const fpath = (uri) => resolve(__dirname, `../views`, uri);

// app.use("/(:file).js", (req: Request, res: Response) => {
//   console.log(req.params.file);
//   res.sendFile(fpath(req.params.file + ".js"));
// });
// // router.use("/", express.static(resolve(__dirname, "../views/")));
// const cachedINdex = readFileSync("views/index.html")
//   .toString()
//   .split("<!-- data -->");

// const writeSync = async (ws: Writable, str: string) => {
//   new Promise((resolve) => ws.write(str, resolve));
// };
// const pipeSync = async (ws: Writable, rs: Readable) => {
//   new Promise((resolve) => {
//     rs.pipe(ws, { end: false });
//     rs.on("end", resolve);
//   });
// };
// app.use("/", async (req: Request, res: Response) => {
//   listContainerFiles("pcm").pipe(res);
// });

app.listen(3222, console.log);
