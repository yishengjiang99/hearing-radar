export function templateUI(): {
	stdout: (str: string) => void;
	rx1Div: HTMLDivElement;
	postRx1: (str: String) => void;
	cp: HTMLDivElement;
} {
	const stdoutdiv: HTMLDivElement = document.querySelector("#stdout");
	const rx1Div: HTMLDivElement = document.querySelector<HTMLDivElement>(
		"div#rx1"
	);
	const cp = document.querySelector<HTMLDivElement>("div#cp");
	const stdoutBuffer = [];
	let rx1 = "";
	const stdin = document.querySelector("input");
	let upcursor = 0;
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
		if (stdoutdiv) {
			stdoutdiv.innerHTML = stdoutBuffer
				.map((str) => `<br>${str}`)
				.join("");
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
		stdoutBuffer.push(str);
		if (stdoutBuffer.length > 50) {
			stdoutBuffer.shift();
		}
		render();
	};
	return {
		stdout,
		rx1Div,
		postRx1,
		cp,
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
	const btn = document.createElement("button");
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
