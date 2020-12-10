import { BlockBlobClient, BlobServiceClient } from "@azure/storage-blob";
import { BlobService } from "azure-storage";

import { execSync, spawn } from "child_process";
import { readFileSync, statSync } from "fs";
import { header } from "grep-wss";
import { createHmac } from "crypto";

import * as Mime from "mime";
import { basename, dirname, resolve } from "path";
import { stdout } from "process";
export { listContainerFiles } from "./list-blobs";
export * from "./page-blobs";

export const wsclient = (azconn_str = ""): BlobServiceClient =>
  BlobServiceClient.fromConnectionString(
    azconn_str ||
      process.env.AZ_CONN_STR ||
      process.env.AZURE_STORAGE_CONNECTION_STRING
  );

export const uploadFileSync = (path): Promise<BlockBlobClient | void> => {
  const file = resolve(path);
  return wsclient()
    .getContainerClient("midi")
    .uploadBlockBlob(basename(file), readFileSync(file), statSync(file).size, {
      blobHTTPHeaders: {
        blobContentType: require("mime-types").lookup(file),
      },
    })
    .then(({ blockBlobClient, response }) => {
      if (response.errorCode && !blockBlobClient)
        throw new Error(response.errorCode);
      return blockBlobClient;
    })
    .catch((e) => {
      Promise.reject(e);
    });
};
export const cspawn = (cmd, str) => {
  const proc = spawn(cmd, str.split(" "));
  proc.stderr.pipe(process.stderr);
  // console.log(cmd + " " + str);
  return proc;
};

if (process.argv[2]) {
  console.log("uploading " + process.argv[2]);
  uploadFileSync(process.argv[2])
    .then((res) => {
      process.stdout.write(res && res.url);
    })
    .catch(console.log);
}
const headersToSign = [
  "Content-Encoding",
  "Content-Language",
  "Content-Length",
  "Content-MD5",
  "Content-Type",
  "Date",
  "If-Modified-Since",
  "If-Match",
  "If-None-Match",
  "If-Unmodified-Since",
  "Range",
];
// const upload_pages = (container, blobName, buffer: Buffer, offset) => {
//   // const url = wsclient().getContainerClient(container).url + "/blobname";
//   const xmsversion = `x-ms-version: 2014-02-14`;
//   const datestr = new Date().toUTCString();
//   const {accountName, accountUrl}=wsclient();
//   const headers = {
//     "x-ms-version": "2014-02-14",
//     "x-ms-page-write": "update",
//     "Content-Length": buffer.byteLength,
//     "x-ms-date": datestr,
//     "x-ms-blob-type": "PageBlob",
//     Range: "Byte:0-1024",
//   };
//   const signedkey=crypto.createHmac("sha256", process.env.AZ_KEY)
//             .update([
//               'x-ms-blob-type:PageBlob',
//             `x-ms-date:${datestr}`,
//             `x-ms-page-write:update`,
//             'x-ms-version:2014-02-14',
//              `/${accountName}/${container}/${blobName}`,
//              'comp:page'].join("\n"), "utf8")
//             .digest("base64");
//   const auth=
//   [
//     'x-ms-blob-type:PageBlob',
//   `x-ms-date:${datestr}`,
//   `x-ms-page-write:update`,
//   'x-ms-version:2014-02-14',
//    `/${accountName}/${container}/${blobName}`,
//    'comp:page'].join("\n")

//   const signstr =
//     "GET\n" + headersToSign.map((key) => headers[key] || "").join("\n");
//   const canHeaders = headersToSign, (key=>key.startsWith("x-ms"))
//   console.log(signstr);

//   const accUrl = `https://${wsclient().accountName}.blob.core.windows.net`;
//   const date = new Date().toUTCString();
//   const canheaders = `x-ms-date:${date}`;
//   const cmds = [
//     `GET ${datestr}/${container}/${blobName}?comp=page`,
//     ``,
//     `x-ms-page-write: update`,
//     `x-ms-date: ${date}`,
//     `x-ms-blob-type: PageBlob`,
//     `Range: bytes=${offset}-${buffer.byteLength}`,
//     `Authorization: SharedKey ${wsclient().accountName} ${signKey}`,
//   ];
//   return signstr;
// };

const signHeaders = (method, host, path, query, headers) => {
  const auth = [
    method,
    ...headersToSign.map((key) => headers[key] || ""),
    ...Object.keys(headers)
      .filter((k) => k.startsWith("x-ms"))
      .map((k) => `${k}:${headers[k]}`),
    host,
    query
      .split("&")
      .sort()

      .map((k) => k.replace("=", ":")),
  ];
  return createHmac("sha256", process.env.AZ_KEY)
    .update(auth.join("\n"), "utf8")
    .digest("base64");
};

const upload_pages2 = (container, blobName, buffer: Buffer, offset) => {
  const datestr = new Date().toUTCString();
  const accountName = wsclient().accountName;
  const hostname = `${accountName}.azuresites.microsoft.net`;
  const path = `/${container}/${blobName}`;
  const query = `comp=page`;

  const auth = signHeaders("PUT", hostname, path, query, {
    "x-ms-page-write": "update",
    "Content-Length": buffer.byteLength,
    "x-ms-date": datestr,
    "x-ms-blob-type": "PageBlob",
    Range: `byte=${offset}-${buffer.byteLength}`,
  });

  console.log(`PUT https://${hostname}${path}?${query} HTTP/1.1 \n\
  x-ms-page-write: update \n\
  Content-Length: ${buffer.byteLength} \n\
  x-ms-date: ${datestr} \n\
  x-ms-blob-type: PageBlob \n\
  Range: byte=${offset}-${buffer.byteLength} \n\
  Authorization: ${auth}\n\n`);
};

function echo(s: TemplateStringsArray, ..._) {
  console.log(s.raw);
}
// upload_pages2("wav", "song.mp3", Buffer.allocUnsafe(1024), 0);
// //  openssl s_client -connect grep32bit.blob.core.windows.net:443
