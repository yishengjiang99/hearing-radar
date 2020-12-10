#!/usr/sbin/node
import { createReadStream } from "fs";
import { createInflate } from "zlib";
import { createPageBlob } from "./azblob";
const newfile = `newfile.txt;`;
createPageBlob("wav", newfile).then((ws) => {
  process.stdin.on("data", (d) => {
    ws.write(d);
    console.log(d.byteLength);
  });
});
