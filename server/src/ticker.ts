import { EventEmitter } from "events";
import { emit } from "process";

const {
	Worker,
	isMainThread,
	parentPort,
	workerData,
} = require("worker_threads");

if (isMainThread) {
	module.exports = function ticker(gap, onTick) {
		const emitter = new EventEmitter();
		const worker = new Worker("./dist/ticker.js", {
			interval: gap,
		});
		worker.on("message", onTick);
	};
} else {
	const { interval } = workerData;
	const t = setInterval(parentPort.postMessage("tick"), interval);
}
