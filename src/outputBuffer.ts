/* eslint-disable @typescript-eslint/indent */
import { getCtx } from "./ctx";
import { Milliseconds } from "./types";
export interface OutputBufferOptions {
	length?: Milliseconds;
	output?: Float32Array;
	sampleRate?: number;
	outlet?: AudioNode | AudioDestinationNode;
}
export const defaultProps = {
	length: 1000,
	output: new Float32Array((length * getCtx().sampleRate) / 1000),
	transform: (x) => x,
	outlet: getCtx().destination,
};

export function outputBuffer(
	node: AudioNode,
	props: OutputBufferOptions
): {
	node: ScriptProcessorNode;
	samples: () => Promise<Float32Array>;
} {
	const { length, output, transform, outlet } = { ...defaultProps, ...props };
	let ptr = 0;
	const proc = node.context.createScriptProcessor(2 << 9, 2, 2);
	node.connect(proc);
	if (outlet) {
		proc.connect(outlet);
	}
	const sampleGot = new Promise<Float32Array>((resolve) => {
		proc.onaudioprocess = (e: AudioProcessingEvent) => {
			for (
				let channel = 0;
				channel < e.inputBuffer.numberOfChannels;
				channel++
			) {
				const inputData = e.inputBuffer.getChannelData(channel);
				for (let i = 0; i < inputData.length; i++) {
					e.outputBuffer[channel] = inputData[i];
					output[ptr++] = transform(inputData[i]);
					if (ptr >= output.length) {
						resolve(output);
					}
				}
			}
		};
	});
	return {
		node: proc,
		samples: async () => await sampleGot,
	};
}
export async function renderAudioBuffer(node: AudioNode, opts?:OfflineAudioContextOptions): Promise<AudioBuffer>{
	const offctx = new OfflineAudioContext({ ...{length:1024,numberOfChannels:2,sampleRate:44100}, ...(opts||{}) });
	node.connect(node.context.destination);
	return  offctx.startRendering();
}