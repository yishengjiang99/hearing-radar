import { wsclient } from ".";
import { Readable, Transform, Writable } from "stream";
import { BlobItem } from "@azure/storage-blob";
import { execSync } from "child_process";

export function listContainerFiles(container): Readable {
  return Readable.from(
    wsclient().getContainerClient(container).listBlobsFlat()
  );
}
export function listFilesSync(container = "pcm") {
  try {
    const urls = [];
    let str = execSync(
      `curl -s 'https://grep32bit.blob.core.windows.net/${container}?resttype=container&comp=list'`
    ).toString();
    while (str.length) {
      let m = str.match(/<Url>(.*?)<\/Url>/);
      if (!m) break;
      urls.push(m[1]);
      str = str.slice(m[0].length);
    }
    return urls;
  } catch (error) {
    console.log(error.message);
  }
}
