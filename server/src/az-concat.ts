import { exec, execSync, spawn } from "child_process";
import { writeFileSync } from "fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// execSync("mkfifo ./pipe/1");
// execSync("mkfifo ./pipe/2");
// execSync("mkfifo ./pipe/3");
// execSync("mkfifo ./pipe/4");
// writeFileSync(
//   "playlist.txt",
//   [1, 2, 3, 4].map((i) => `\nfile './pipe/${i}'`).join("")
// );

async function run() {
  // spawn(
  //   "ffmpeg",
  //   `-re -stream_loop -1 -i playlist.txt -flush_packets 0 -f mgets -f mp3 -`.split(
  //     " "
  //   )
  // ).stdout.pipe(process.stdout);
  const ffstdin = spawn(
    "ffmpeg",
    `-i pipe:0 -f mp3 -flush_packets 0 -f mgets -f mp3 - |ffplay -i pipe:0 -f mp3`.split(
      " "
    )
  ).stdin;
  exec("cat db/trumpet/65.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1").stdout.pipe(ffstdin);
  exec("cat db/trumpet/62.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/61.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/65.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/62.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/61.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/65.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/62.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/61.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/65.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/62.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
  exec("cat db/trumpet/61.mp3 > pipe/1", (err, stdo) => {
    err ? console.log(err) : console.log(stdo);
  });
  spawn("cat pipe/1 -").stdout.pipe(ffstdin);
}
run();
