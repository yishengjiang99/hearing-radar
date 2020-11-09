export {};
import { expect } from "chai";
const { Fifo, FifoPtr } = require("./fifo.wasmodule");

describe("fifo wasmodule", () => {
	it("uses es6 style imports", () => {
		const { _fifo_init, _fifo_read, ptr } = Fifo();
		console.log(ptr);
		expect(_fifo_read).exist;
		expect(_fifo_init).exist;
	});
});
