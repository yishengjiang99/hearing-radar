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
exports.LSSource = exports.LSGraph = void 0;
var stream_1 = require("stream");
var child_process_1 = require("child_process");
var LSGraph = /** @class */ (function (_super) {
    __extends(LSGraph, _super);
    function LSGraph(basePath) {
        var _this = _super.call(this) || this;
        _this._transform = function (chunk, _, cb) {
            var line = chunk.toString();
            if (line === "") {
                _this.emit("data", JSON.stringify({ n1: _this.n1, dag: _this.dag[_this.n1] }));
                _this.n1 = "";
            }
            else if (_this.n1 === "" && line.trim().endsWith(":")) {
                _this.n1 = line.substring(-1);
                _this.dag[_this.n1] = [];
            }
            else {
                line.split(", ").map(function (file) {
                    _this.dag[_this.n1].push(file);
                });
            }
            cb(null, null);
        };
        _this.n1 = basePath;
        _this.dag = {};
        _this.dag[basePath] = [];
        return _this;
    }
    Object.defineProperty(LSGraph.prototype, "graph", {
        get: function () {
            return this.dag;
        },
        enumerable: false,
        configurable: true
    });
    LSGraph.prototype._flush = function (cb) {
        cb(null, JSON.stringify({ n1: this.n1, dag: this.dag[this.n1] }));
    };
    return LSGraph;
}(stream_1.Transform));
exports.LSGraph = LSGraph;
exports.LSSource = function (path) {
    return child_process_1.spawn("ls", ["-R", "-m"], {
        stdio: [null, "pipe", "pipe"],
        cwd: path,
    }).stdout;
};
