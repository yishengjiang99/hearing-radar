"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = exports.listContainers = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const stream_1 = require("stream");
const ws = storage_blob_1.BlobServiceClient.fromConnectionString("DefaultEndpointsProtocol=https;AccountName=grepmusic;AccountKey=OOmiLHvrARhZKbsBA3EF1gZDyqScQbIwk5B7zukyJcbUrSW4pHd08uxME3+QZ6aSIZm2YdLzb8OOqTW1Gow09w==;EndpointSuffix=core.windows.net");
const containers = ws.listContainers();
const midiContainer = ws.getContainerClient("$web");
exports.listContainers = () => ws.listContainers();
exports.listFiles = (prefix) => {
    midiContainer.listBlobsFlat({ prefix });
    return stream_1.Readable.from(midiContainer.listBlobsFlat({ prefix }), { objectMode: true }).pipe(new stream_1.Transform({
        objectMode: true,
        transform: ({ name, properties: { contentLength, contentType } }, enc, cb) => {
            cb(null, "\n" + [name, ws.getContainerClient(name).url, contentLength, contentType].join(","));
        },
    }));
};
//# sourceMappingURL=pcm.js.map