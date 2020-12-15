"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var chai_1 = require("chai");
var Path = __importStar(require("path"));
var ls_graph_1 = require("./ls-graph");
var readline_transform_1 = require("./readline-transform");
describe("ls -R -m", function () {
    var rl;
    beforeEach(function () {
        rl = new readline_transform_1.ReadlineTransform();
    });
    it("streams output of recursive ls", function () {
        var lsgraph = new ls_graph_1.LSGraph("root");
        lsgraph.on("data", function (d) {
            process.stdout.write(d);
            chai_1.expect(lsgraph.graph).to.exist;
        });
        ls_graph_1.LSSource(Path.resolve(__dirname, "../test/mock"))
            .pipe(rl)
            .pipe(lsgraph);
        rl.on("data", function (d) {
            process.stdout.write("[" + d.toString() + "]");
        });
        // sp.on("exit", () => writable.end());
    }).timeout(10000);
});
describe("node_modules", function () {
    var rl;
    beforeEach(function () {
        rl = new readline_transform_1.ReadlineTransform();
    });
    it("rm -rf ", function () {
        var lsgraph = new ls_graph_1.LSGraph("node_modules");
        var stdout = ls_graph_1.LSSource(Path.resolve(__dirname, "../node_modules"));
        lsgraph.on("data", function (d) {
            var n = JSON.parse(d);
            var indentstr = " ".repeat(n.n1.split("/").length) + "|->";
            process.stdout.write(n.n1 + "\n");
            process.stdout.write(indentstr + n.dag.join(", ") + "\n");
        });
        lsgraph.on("end", function () {
            process.stdout.end("\r\n\tTotal: " + process.uptime() + "\r\n");
            chai_1.expect(lsgraph.graph).to.exist;
        });
        stdout.pipe(rl).pipe(lsgraph);
        // sp.on("exit", () => writable.end());
    }).timeout(10000);
});
