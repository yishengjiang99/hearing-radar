"use strict";
exports.__esModule = true;
var events_1 = require("events");
var _a = require("worker_threads"), Worker = _a.Worker, isMainThread = _a.isMainThread, parentPort = _a.parentPort, workerData = _a.workerData;
if (isMainThread) {
    module.exports = function ticker(gap, onTick) {
        var emitter = new events_1.EventEmitter();
        var worker = new Worker("./dist/ticker.js", {
            interval: gap
        });
        worker.on("message", onTick);
    };
}
else {
    var interval = workerData.interval;
    var t = setInterval(parentPort.postMessage("tick"), interval);
}
