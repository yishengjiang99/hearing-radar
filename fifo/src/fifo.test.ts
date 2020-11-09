export {};
import { expect } from "chai";
const { Fifo, FifoPtr } = require("../fifo.wasmodule");

describe("fifo wasmodule", () => {
	it("uses es6 style imports", () => {
		const {
			_fifo_init,
			read,
			write,
			readFloat32,
			ptr,
			Module,
			HeapU32,
			HeapU8,
			available,
			free,
		} = Fifo();

		console.log(ptr);
		expect(read).exist;
		write([1, 2, 3, 4]);
		expect(available()).to.equal(4);
		const rr = read(8);
		expect(rr);
	});
});
