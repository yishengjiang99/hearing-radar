"use strict";
const { Fifo, FifoPtr } = require("./fifo.wasmodule.js");
const { expect } = require("chai");
const f = Fifo(1024);
f.write(new Uint8Array([1, 2, 3, 4]));
const arr = f.read(3);
function asserts(test, statement) {
	if (statement === false) throw new Error("test failed " + test);
}
asserts("t1", arr[0] === 1);
asserts("t2", arr[1] === 2);

asserts("t3", f.available() === 1);
