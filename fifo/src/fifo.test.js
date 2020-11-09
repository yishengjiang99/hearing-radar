"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var fifo_wasmodule_1 = require("./fifo.wasmodule");
describe("fifo wasmodule", function () {
    it("uses es6 style imports", function () {
        var _a = fifo_wasmodule_1.Fifo(), _fifo_init = _a._fifo_init, _fifo_read = _a._fifo_read, ptr = _a.ptr;
        console.log(ptr);
        chai_1.expect(_fifo_read).exist;
        chai_1.expect(_fifo_init).exist;
        available:
    });
});
