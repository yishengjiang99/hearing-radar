export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, resolve } from "path";
import { Application, Request, Response, Router } from "express";
import { ReadlineTransform, LSGraph, LSSource } from "grep-transform";
import { existsSync, readFileSync } from "fs";
import { download, listFiles } from "./pcm";

let files = [
  "synth/440/-ac2-f32le.wav",
  "synth/440/-ac2-s16le.wav",
  "samples/billie-ac2-ar-44100-s16le.pcm",
];
const express = require("express");
const app: Application = express();
export const router: Router = express.Router();
router.use("*", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});

router.use("/midi", (req, res) => {
  res.redirect("https://grepudio.azurewebsites.net/api/list?q=midi");
});
router.use("/mp3", (req, res) => {
  res.redirect("https://grepudio.azurewebsites.net/api/list?q=mp3");
});
router.get("/r", (req, res: Response) => {
  res.status(200);
  res.contentType("text/html");

  LSSource(resolve(__dirname, "../db"))
    .pipe(new ReadlineTransform())
    .pipe(new LSGraph("."))
    .on("data", (d) => {
      res.write(d.toString());
    })
    .on("end", () => res.end());
});
router.get("/play", (req, res) => {
  return res.render("index.html");
});
router.get("/samples/:filename", (req, res) => {
  const ctx = SSRContext.fromFileName(
    "./samples/billie-ac2-ar-44100-s16le.pcm"
  );
  const file = new FileSource(ctx, {
    filePath: "./samples/billie-ac2-ar-44100-s16le.pcm",
  });
  file.connect(ctx);
  const play = spawn("ffplay", "-i pipe:0 -ac 2 -ar 44100 -f s16le".split(" "))
    .stdin;
  ctx.on("data", (d) => {
    play.write(d);
  }); //(play); //spawn('ffplay',`-i pipe:0 -ac 2 -ar 4410 -f s16le`.split(' '))))
  ctx.start();
});
router.get("/synth/:freq/:desc.wav", (req, res) => {
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

router.get("/db/:dir/:file", (req, res) => {
  const path = resolve("db", req.params.dir, req.params.file); //, req.url.search["path"]);
  res.end(path);
});

router.get("/synth/:freq/:desc", (req, res) => {
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
const fpath = (uri) => resolve(__dirname, `../../public/${uri}`);

router.use("/build/:file", (req: Request, res: Response) => {
  console.log(req.params.file);
  res.sendFile(fpath("build/" + req.params.file));
});

router.use("/", (req: Request, res: Response) => {
  const fpath = resolve(__dirname, `../../public/${req.url}`);
  res.end(`
		<html>
		<head>
		</head>
		<body>
		<div id='container'>
			<div id='menu'>
				${files
          .map((f) => `<li><button href='${f}'>${basename(f)}</button><li>`)
          .join("")}
			</div>

			<div id='stdout'></div>
			<input type='file' value='sele'>input</input>
			<input size=80 autofocus ></input>
		</div>
		<div id='rx'>
			<div id='rx1'></div>
			<div id='rx2'></div>
		</div>
    <script src='./build/templateUI.js' type='module'>

		</script>
		</body>
		</html>
		`);
});

if (require.main === module) {
  const app: Application = express();
  app.use("/node", router);
  app.use("/", router);
  app.listen(3000);
}
