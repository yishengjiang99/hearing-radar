"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const grep_wss_1 = require("grep-wss");
const path_1 = require("path");
let connections = [];
grep_wss_1.WebSocketServer({
    port: 5150,
    onHttp: (req, res) => {
        const page = req.url === '/' ? '/index.html' : req.url;
        const path = path_1.resolve(__dirname, "../../public", page);
        res.end(path);
    },
    onListening: () => {
        console.log("listening");
    },
    onConnection: (reply) => {
        reply("HI");
    },
    onData: (data, reply) => {
        reply(data);
    }
});
//# sourceMappingURL=server.js.map