export type Frequency = number;
export type Midi = number;

export type Filter = {
	frequency: Frequency;
	q: number;
};

export type ADSR = number[];
export type Percent = number; // TODO: put conditional guards here when I figure out how to do them
export interface AudioWorkletProcessor {
	readonly port: MessagePort;
	process(
		inputs: Float32Array[],
		outputs: Float32Array[],
		parameters: Record<string, Float32Array>
	): boolean;
}

// export declare var AudioWorkletProcessor: {
// 	prototype: AudioWorkletProcessor;
// 	new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
// };

export declare function registerProcessor(
	name: string,
	processorCtor: (new (
		options?: AudioWorkletNodeOptions
	) => AudioWorkletProcessor) & {
		parameterDescriptors?: AudioParamDescriptor[];
	}
);

export type Milliseconds = number;

// https://rjzaworski.com/2019/10/event-emitters-in-typescript
type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventMap> {
	on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
	off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
	emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}
export function eventEmitter<T extends EventMap>(): Emitter<T> {
	const listeners: {
		[K in keyof EventMap]?: Array<(p: EventMap[K]) => void>;
	} = {};

	return {
		on(key, fn) {
			listeners[key] = (listeners[key] || []).concat(fn);
		},
		off(key, fn) {
			listeners[key] = (listeners[key] || []).filter((f) => f !== fn);
		},
		emit(key, data) {
			(listeners[key] || []).forEach((fn) => {
				fn(data);
			});
		},
	};
}
