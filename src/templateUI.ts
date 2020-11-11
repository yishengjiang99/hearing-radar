export function templateUI(): {
	stdout: (str: string) => void;
	rx1Div: HTMLDivElement;
	postRx1: (str: string) => void;
	postRx2: (str: string) => void;
	cp: HTMLDivElement;
	appendNOde: (node: HTMLElement, name: string) => void;
} {
	const stdoutdiv: HTMLDivElement = document.querySelector("#stdout");

	const rx1Div: HTMLDivElement = document.querySelector<HTMLDivElement>(
		"div#rx1"
	);

	const rx2Div: HTMLDivElement = document.querySelector<HTMLDivElement>(
		"div#rx2"
	);
	const cp = document.querySelector<HTMLDivElement>("div#cp");
	const stdin = document.querySelector<HTMLInputElement>("input");
	const stdoutBuffer = [];
	const virtualDom: { [key: string]: HTMLElement } = {};
	let rx1,
		rx2 = "";
	let upcursor = 0;
	let t0 = null;

	window.onkeydown = (e: KeyboardEvent) => {
		stdin.focus();
		if (e.key === "Enter") {
			const str = stdin.value;
			stdin.value = "";
			upcursor = 0;
			stdout(str);
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
			return;
		}
		stdoutdiv.innerHTML = stdoutBuffer
			.map((l) => `<div>${l}</div>`)
			.join("");
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
	const postRx2 = (str) => {
		if (rx2 === str) {
			return;
		}
		rx2 = str;
		requestAnimationFrame(() => {
			rx2Div ? (rx2Div.innerHTML = rx2) : null;
		});
	};
	const stdout = (str) => {
		if (str === "init_clock") t0 = performance.now();
		else if (str === "reset clock") t0 = null;
		else stdoutBuffer.push(str);

		if (stdoutBuffer.length > 50) {
			stdoutBuffer.shift();
		}
		console.log(stdoutBuffer.length);

		render();
	};
	return {
		stdout,
		rx1Div,
		postRx1,
		postRx2,
		cp,
		appendNOde: (node: HTMLElement, name: string) => {
			virtualDom[name] = node;
			stdout(`vd:${name}`);
		},
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
