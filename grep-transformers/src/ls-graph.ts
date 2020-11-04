import { Transform, TransformCallback } from "stream";
import { spawn } from "child_process";
export class LSGraph extends Transform {
	n1: string;
	dag: { [key: string]: string[] };
	constructor(basePath: string) {
		super();
		this.n1 = basePath;
		this.dag = {};
		this.dag[basePath] = [];
	}
	get graph() {
		return this.dag;
	}
	_transform = (
		chunk: { toString: () => string },
		_: BufferEncoding,
		cb: TransformCallback
	) => {
		const line: string = chunk.toString();
		if (line === "") {
			this.emit(
				"data",
				JSON.stringify({ n1: this.n1, dag: this.dag[this.n1] })
			);
			this.n1 = "";
		} else if (this.n1 === "" && line.trim().endsWith(":")) {
			this.n1 = line.substring(-1);
			this.dag[this.n1] = [];
		} else {
			line.split(", ").map((file) => {
				this.dag[this.n1].push(file);
			});
		}
		cb(null, null);
	};
	_flush(cb: TransformCallback) {
		cb(null, JSON.stringify({ n1: this.n1, dag: this.dag[this.n1] }));
	}
}

export const LSSource = (path: string) =>
	spawn("ls", ["-R", "-m"], {
		stdio: [null, "pipe", "pipe"],
		cwd: path,
	}).stdout;
