import { Transform } from "stream";

export class GraphLS extends Transform {
	n1: string;
	dag: { [key: string]: string[] };
	constructor(basePath: string) {
		super();
		this.n1 = basePath;
		this.dag = {};
		this.dag[basePath] = [];
	}
	_transform = (
		chunk: { toString: () => string },
		enc: any,
		cb: (arg0: null, arg1: { n1: string; dag: string[] }) => void
	) => {
		const line: string = chunk.toString();
		if (line === "") {
			cb(null, { n1: this.n1, dag: this.dag[this.n1] });
			this.n1 = "";
		} else if (this.n1 === "" && line.trim().endsWith(":")) {
			this.n1 = line.substring(-1);
			this.dag[this.n1] = [];
		} else {
			line.split(",").map((file) => {
				this.dag[this.n1].push(file);
			});
		}
	};
	_flush() {
		return { n1: this.n1, dag: this.dag[this.n1] };
	}
}
