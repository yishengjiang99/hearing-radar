import { Writable } from "stream";

class Output extends Writable {
	_write: (
		chunk: Buffer,
		encoding,
		callback: (error?: Error | null) => void
	) => {};
}
