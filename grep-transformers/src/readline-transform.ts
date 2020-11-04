import { Transform, TransformCallback } from "stream";

/**
 * The ReadlineTransform is reading String or Buffer content from a Readable stream
 * and writing each line which ends without line break as object
 *
 * @param {RegExp} opts.breakMatcher - line break matcher for str.split() (default: /\r?\n/)
 * @param {Boolean} opts.ignoreEndOfBreak - if content ends with line break, ignore last empty line (default: true)
 * @param {Boolean} opts.skipEmpty - if line is empty string, skip it (default: false)
 */
const NEWLINE = 0x0a;
export class ReadlineTransform extends Transform {
	_buf: Buffer;
	wptr: number;
	size: number;
	constructor() {
		super();
		this._buf = Buffer.alloc(1024);
		this.size = 1024;
		this.wptr = 0;
	}
	expandBuffer() {
		this._buf = Buffer.concat([this._buf, Buffer.alloc(2 * this.size)]);
		this.size += 2 * this.size;
	}

	_transform(chunk: any, _: BufferEncoding, cb: TransformCallback) {
		let lb;
		while (chunk.length && (lb = chunk.indexOf(NEWLINE)) >= 0) {
			this._emitData(chunk.slice(0, lb));
			chunk = chunk.slice(lb + 1);
		}
		if (chunk.length) {
			if (this.wptr + chunk.length > this.size) {
				this.expandBuffer();
			}
			chunk.copy(this._buf, this.wptr, 0, chunk.length);
			this.wptr += chunk.length;
		}
		cb(null, null);
	}

	_emitData(slice: Buffer) {
		if (this.wptr) {
			this.emit(
				"data",
				Buffer.concat([this._buf.slice(0, this.wptr), slice])
			);
			this.wptr = 0;
		} else {
			this.emit("data", slice);
		}
	}
	_flush(cb: TransformCallback) {
		cb(null, this._buf.slice(0, this.wptr));
	}
}
