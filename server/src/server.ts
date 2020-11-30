export {};
import { execSync, spawn, exec } from "child_process";
import { Oscillator, FileSource } from "./audio-data-source";
import { SSRContext } from "./ssrctx";
import { basename, resolve } from "path";
import { Application, Request, Response, Router } from "express";
import { ReadlineTransform, LSGraph, LSSource } from "grep-transform";
import { createReadStream, existsSync, readFileSync, writeFileSync } from "fs";

import { convertMidi } from "./sequence";
import { cspawnToBuffer } from "./ffmpeg-link";

let files = [
  "synth/440/-ac2-f32le.wav",
  "synth/440/-ac2-s16le.wav",
  "samples/billie-ac2-ar-44100-s16le.pcm",
].concat(
  JSON.parse(
    execSync(
      "curl https://grepudio.azurewebsites.net/api/list -o -|json_pp"
    ).toString()
  ).map((p) => p.url)
);

const express = require("express");
const app: Application = express();
const compiler = require("express-react-forked");
app.set("views", require("path").resolve(__dirname, "../views"));
app.set("view engine", "jsx");
app.engine("jsx", compiler());
export const router: Router = express.Router();
router.use("*", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  next();
});
router.use("/note/:midi/:instrument.pcm", (req, res) => {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "audio/pcm",
    "Content-Disposition": "inline",
  });
  let ms;

  const tt = req.query.t || 1;
  const start = (parseInt(req.params.midi) - 21) * 433840 * 2;
  const end = start + 44100 * 4 * 2 * parseFloat(tt as string);
  const length = createReadStream(`db/${req.params.instrument}-32.pcm`, {
    start,
    end,
  }).pipe(res);
});
router.use("/chord/:midi1/:midi2/:midi3/:instrument.mp3", (req, res) => {
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
router.use("/midi/:name", async (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/csv",
    "Content-Disposition": "inline",
  });
  res.flushHeaders();
  // req.on("end", () => res.end());
  await convertMidi("./song.mid", req, res);
  res.end();
});
router.use("/midi", (req, res) => {
  res.json(
    JSON.parse(
      execSync(
        "curl https://grepudio.azurewebsites.net/api/list -o -|json_pp"
      ).toString()
    ).map((p) => {
      return { name: p.name, url: `midi/${basename(p.name)}` };
    })
  );
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
/*

const ws = BlobServiceClient.fromConnectionString(
  "DefaultEndpointsProtocol=https;AccountName=grepmusic;AccountKey=OOmiLHvrARhZKbsBA3EF1gZDyqScQbIwk5B7zukyJcbUrSW4pHd08uxME3+QZ6aSIZm2YdLzb8OOqTW1Gow09w==;EndpointSuffix=core.windows.net"
);
const cc = ws.listContainers();
(async function () {
  const cs = [];
  for await (const c of cc) {
    console.log(c);
    cs.push(c);
  }
  const cll: ContainerClient = ws.getContainerClient(cs.shift().name);
  const ob = Buffer.alloc(9000 * 16);
  let offset = 0;

  const s = (10089 / 3) * 0.2;
  cll
    .getBlobClient("db/db/Fatboy_pad_5_bowed/67.mp3")
    .downloadToBuffer(ob, offset, s);
  offset += s;

  for await (const blob of cll.listBlobsByHierarchy(",")) {
    console.log(blob);
  }
})();
*/
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
const fpath = (uri) => resolve(__dirname, `../../radar/public/${uri}`);

router.use("/build/:file", (req: Request, res: Response) => {
  console.log(req.params.file);
  res.sendFile(fpath("build/" + req.params.file));
});
// router.use("/", express.static(resolve(__dirname, "../views/")));

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
    <script src='./build/playback.js' type='module'>

		</script>
		</body>
		</html>
		`);
});

if (require.main === module) {
  const app: Application = express();
  // const compiler = require("express-react-forked");
  // app.set("views", require("path").resolve(__dirname, "../views"));
  // app.set("view engine", "jsx");
  // app.engine("jsx", compiler());
  app.use("/node", router);
  app.use("/", router);
  app.listen(2992);
}
