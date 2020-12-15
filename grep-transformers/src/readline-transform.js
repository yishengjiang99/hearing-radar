"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadlineTransform = void 0;
var stream_1 = require("stream");
/**
 * The ReadlineTransform is reading String or Buffer content from a Readable stream
 * and writing each line which ends without line break as object
 *
 * @param {RegExp} opts.breakMatcher - line break matcher for str.split() (default: /\r?\n/)
 * @param {Boolean} opts.ignoreEndOfBreak - if content ends with line break, ignore last empty line (default: true)
 * @param {Boolean} opts.skipEmpty - if line is empty string, skip it (default: false)
 */
var NEWLINE = 0x0a;
var ReadlineTransform = /** @class */ (function (_super) {
    __extends(ReadlineTransform, _super);
    function ReadlineTransform() {
        var _this = _super.call(this) || this;
        _this._buf = Buffer.alloc(1024);
        _this.size = 1024;
        _this.wptr = 0;
        return _this;
    }
    ReadlineTransform.prototype.expandBuffer = function () {
        this._buf = Buffer.concat([this._buf, Buffer.alloc(2 * this.size)]);
        this.size += 2 * this.size;
    };
    ReadlineTransform.prototype._transform = function (chunk, _, cb) {
        var lb;
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
    };
    ReadlineTransform.prototype._emitData = function (slice) {
        if (this.wptr) {
            this.emit("data", Buffer.concat([this._buf.slice(0, this.wptr), slice]));
            this.wptr = 0;
        }
        else {
            this.emit("data", slice);
        }
    };
    ReadlineTransform.prototype._flush = function (cb) {
        cb(null, this._buf.slice(0, this.wptr));
    };
    return ReadlineTransform;
}(stream_1.Transform));
exports.ReadlineTransform = ReadlineTransform;
