"use strict";

import { RSA_NO_PADDING } from "constants";
import { createReadStream } from "fs";
import { Transform } from "stream";

import { wsclient } from ".";

const minchunk = 1024;
export const createPageBlob = async (filename, container) => {
  const cc = wsclient();
  const blob = cc.getContainerClient(container).getPageBlobClient(filename);
  try {
    await blob.create(minchunk, {
      blobHTTPHeaders: {
        blobContentType: require("mime").lookup(filename),
      },
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  let pageOffset = 0;
  let leftover = Buffer.alloc(0);

  return new Transform({
    highWaterMark: minchunk * 10,
    transform: (chunk, enc, cb) => {
      let n = 0;
      if (leftover.length + chunk.byteLength < minchunk) {
        leftover = Buffer.concat([leftover, chunk]);
        console.log(leftover.byteLength);
        cb(null, null);
      } else {
        console.log(leftover.byteLength);
        for (; n < leftover.length + chunk.byteLength; n += minchunk);
        const agg = Buffer.concat([
          leftover,
          chunk.slice(0, n - leftover.byteLength),
        ]);
        /*
        PageBlob.prototype.uploadPages = function (body, contentLength, options, callback) {
	return this.client.sendOperationRequest({
		body: body,
		contentLength: contentLength,
		options: options
	}, uploadPagesOperationSpec, callback);
};*/
        blob
          .uploadPages(agg, n, pageOffset)
          .then((resp) => {
            pageOffset += n;
            leftover = chunk.slice(n);
            console.log(pageOffset, n);
            cb(null, resp._response.status);
          })
          .catch((err) => {
            cb(null, err.message);
          });
      }
    },
    flush: (cb) => {
      if (leftover.byteLength) {
        const agg = Buffer.concat([
          leftover,
          Buffer.alloc(minchunk - leftover.byteLength).fill(0),
        ]);
        blob
          .uploadPages(agg, minchunk, pageOffset)
          .then(console.log)
          .catch(console.error);
        cb(null, null);
      }
    },
  });
};

if (process.argv[2]) {
  const filename = process.argv[2].trim();
  if (filename.endsWith(".mid")) {
    console.log("s");
    createPageBlob(filename, "midi")
      .then((ws) => {
        createReadStream(filename).pipe(ws).pipe(process.stdout);
      })
      .catch(console.error);
    // createReadStream("filename").pipe(await createPageBlob("midi", filename));
  }
}
