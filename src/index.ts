import { useState, useEffect, useCallback } from "react";
import { ListMenu, Rx1, StandardOutput } from "./app.jsx";
import * as React from "react";
import { render } from "react-dom";
interface AppState {
	ctx: AudioContext;
	worker: Worker;
	processor: AudioWorkletNode;
	msgs: string[];
	stats: {
		rms: number;
		buffered: number;
		loss: number;
	};
}
export const IndexPage = ({ workerUrl, procUrl, apiUrl, menuLinks }) => {
	const [state, setState] = useState<AppState>({
		ctx: null,
		worker: null,
		processor: null,
		msgs: null,
		stats: {
			rms: 0,
			buffered: 0,
			loss: 0,
		},
	});

	const handleClick = useCallback((event: MouseEvent) => {
		if (event.target instanceof HTMLLinkElement) {
			state.worker.postMessage({ sampleUrl: event.target.href });
		}
	}, []);

	useEffect(() => {
		if (!state.ctx) {
			setState((prevState: AppState) => {
				return {
					...prevState,
					ctx: new AudioContext({ latencyHint: "playback" }),
				};
			});
		}
		if (state.ctx && !state.processor) {
			state.ctx.audioWorklet
				.addModule(procUrl)
				.then(() => {
					setState((prev: AppState) => {
						prev.processor = new AudioWorkletNode(
							state.ctx,
							"playback-processor",
							{
								numberOfInputs: 0,
								numberOfOutputs: 1,
								outputChannelCount: [2],
							}
						);
						return prev;
					});
				})
				.catch((err: Error) => {
					throw err;
				});
		}
		if (state.ctx && state.processor && !state.worker) {
			workerUrl;
		}
	}, [state.ctx, state.processor, state.worker]);
	return React.createElement("<>", {}, [
		React.createElement(ListMenu, {
			menuLinks: menuLinks,
			onClick: handleClick,
		}),
		React.createElement(StandardOutput, {
			msgList: state.msgs,
		}),
		React.createElement(Rx1),
	]);
};

document.onload = () => {
	render(
		React.createElement(IndexPage, {
			apiUrl: "/index.php",
			workerUrl: "playback-worker",
			procUrl: "playback-processor",
			menuLinks: [],
		}),
		document.querySelectorAll("container")
	);
};
