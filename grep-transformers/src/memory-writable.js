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
exports.MemoryWritable = void 0;
var stream_1 = require("stream");
var MemoryWritable = /** @class */ (function (_super) {
    __extends(MemoryWritable, _super);
    function MemoryWritable() {
        var _this = _super.call(this, { objectMode: true }) || this;
        _this._results = [];
        return _this;
    }
    Object.defineProperty(MemoryWritable.prototype, "data", {
        get: function () {
            return this._results;
        },
        enumerable: false,
        configurable: true
    });
    MemoryWritable.prototype._write = function (data, encoding, cb) {
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
    };
    return MemoryWritable;
}(stream_1.Writable));
exports.MemoryWritable = MemoryWritable;
