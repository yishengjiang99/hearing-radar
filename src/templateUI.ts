import { outputBuffer } from "./outputBuffer";
export type IOFunction = (str: string) => string;
export type Heap = { [key: string]: any };
export type Shell = {
	prompt?: string;
	pid: number;
	context?: Heap;
	io: IOFunction;
};
export type ShellPropts = {
	name: string;
	io?: IOFunction;
	prompt?: string;
	context?: Heap;
};
export function templateUI(): {
	stdout: (str: string) => void;
	rx1Div: HTMLDivElement;
	postRx1: (str: String) => void;
	cp: HTMLDivElement;
	appendNOde: (node: HTMLElement, name: string) => void;
	appendScript: ShellPropts;
} {
	const stdoutdiv: HTMLDivElement = document.querySelector("#stdout");
	if (!stdoutdiv) {
		document.body.innerHTML += `<div id='container'>
		<div class='relative'>
			<div id='rx1'></div>
			<div id='stdout'></div>
			<div id='cp'></div>
			<input size=80 autofocus />
		</div>
	</div>`;
	}
	const rx1Div: HTMLDivElement = document.querySelector<HTMLDivElement>(
		"div#rx1"
	);
	const cp = document.querySelector<HTMLDivElement>("div#cp");
	const stdin = document.querySelector<HTMLInputElement>("input");
	const stdoutBuffer = [];
	const virtualDom: { [key: string]: HTMLElement } = {};
	let rx1 = "";
	let upcursor = 0;
	let t0 = null;

	window.onkeydown = (e: KeyboardEvent) => {
		stdin.focus();
		if (e.key === "Enter") {
			stdout(stdin.value);
			stdin.value = "";
			upcursor = 0;
		}

		if (e.key === "ArrowUp" || e.key === "ArrowDown") {
			e.key === "ArrowUp" && upcursor++;
			e.key === "ArrowDown" && upcursor--;
			if (upcursor > 0) {
				stdin.value = stdoutBuffer[stdoutBuffer.length - upcursor];
			}
		}
	};
	function render() {
		if (!stdoutdiv) {
			document.body.innerHTML += `<div id='container'>
			<div class='relative'>
				<div id='rx1'></div>
				<div id='stdout'></div>
				<div id='cp'></div>
				<input size=80 autofocus />
			</div>
		</div>`;
		}
		const divs = stdoutdiv.querySelectorAll("div");
		for (let i = 0; i < stdoutBuffer.length; i++) {
			const div = divs[i] || document.createElement("div");
			if (!divs[i]) stdoutdiv.appendChild(div);
			const str = stdoutBuffer[i];
			if (str.toString().startsWith("vd:")) {
				div.innerHTML = "";
				div.appendChild(virtualDom[str.replace("vd:", "")]);
			} else {
				div.innerHTML = str;
			}
		}
	}
	const postRx1 = (str) => {
		if (rx1 === str) {
			return;
		}
		rx1 = str;
		requestAnimationFrame(() => {
			rx1Div ? (rx1Div.innerHTML = rx1) : null;
		});
	};
	const stdout = (str) => {
		if (str === "init_clock") t0 = performance.now();
		else if (str === "reset clock") t0 = null;
		else if (str.toString().substring(0, 2) === "vd:") {
			stdoutBuffer.push(str);
		} else {
			if (t0 !== null) {
				stdoutBuffer.push(
					`${((performance.now() - t0) / 1000).toFixed(1)} ${str}`
				);
			} else {
				stdoutBuffer.push(str);
			}
		}
		if (stdoutBuffer.length > 50) {
			stdoutBuffer.shift();
		}
		render();
	};

	const winthos: { [key: string]: Shell } = {};
	const appendScript = (props: ShellPropts) => {
		const { name, io, prompt, context } = props;
		winthos[name] = { io, prompt, context, pid: 42 };
	};
	return {
		stdout,
		rx1Div,
		postRx1,
		cp,
		appendNOde: (node: HTMLElement, name: string) => {
			virtualDom[name] = node;
			stdout(`vd:${name}`);
		},
		appendScript,
	};
}

export const createActionBtn = (
	offStateText: string,
	onStateText: string,
	fn: (state: any) => void,
	offFn?: (state: any) => void
) => {
	let state = {
		on: false,
	};
	const btn = document.createElement("div");

	btn.textContent = offStateText;
	btn.addEventListener("click", (e) => {
		if (!state.on) fn(state);
		else if (offFn) {
			offFn(state);
		}
		state.on = !state.on;
		btn.textContent = state.on ? onStateText : offStateText;
	});
	return btn;
};
