import { expect } from "chai";
import * as Path from "path";
import { LSGraph, LSSource } from "./ls-graph";
import { ReadlineTransform } from "./readline-transform";
describe("ls -R -m", () => {
	let rl: ReadlineTransform;
	beforeEach(() => {
		rl = new ReadlineTransform();
	});
	it("streams output of recursive ls", () => {
		const lsgraph = new LSGraph("root");

		lsgraph.on("data", (d) => {
			process.stdout.write(d);
			expect(lsgraph.graph).to.exist;
		});

		LSSource(Path.resolve(__dirname, "../test/mock"))
			.pipe(rl)
			.pipe(lsgraph);
		rl.on("data", (d) => {
			process.stdout.write(`[${d.toString()}]`);
		});

		// sp.on("exit", () => writable.end());
	}).timeout(10000);
});
describe("node_modules", () => {
	let rl: ReadlineTransform;
	beforeEach(() => {
		rl = new ReadlineTransform();
	});
	it("rm -rf ", () => {
		const lsgraph = new LSGraph("node_modules");

		const stdout = LSSource(Path.resolve(__dirname, "../node_modules"));

		lsgraph.on("data", (d) => {
			const n = JSON.parse(d);
			const indentstr = " ".repeat(n.n1.split("/").length) + "|->";

			process.stdout.write(n.n1 + "\n");
			process.stdout.write(indentstr + n.dag.join(", ") + "\n");
		});
		lsgraph.on("end", () => {
			process.stdout.end("\r\n\tTotal: " + process.uptime() + "\r\n");
			expect(lsgraph.graph).to.exist;
		});

		stdout.pipe(rl).pipe(lsgraph);

		// sp.on("exit", () => writable.end());
	}).timeout(10000);
});
