import { Writable } from "stream";
export type ErrorOrNullCB = (error?: Error | null) => void;
export class MemoryWritable extends Writable {
	private _results: any[];
	constructor() {
		super({ objectMode: true });
		this._results = [];
	}

	get data() {
		return this._results;
	}

	_write(data: any, encoding: BufferEncoding, cb: ErrorOrNullCB) {
		switch (encoding) {
			case "utf8":
			case "utf-8":
			case "ascii":
			case "base64":
				this._results.push(data.toString(encoding));
				break;
			default:
				this._results.push(data);
				break;
		}
		cb(null);
	}
}
