/// <reference types="node" />
import { EventEmitter } from "events";
import { Writable } from "stream";
import { AudioDataSource } from "./audio-data-source";
import { Decoder, Encoder } from "./kodak";
declare type Time = [number, number];
export declare const timediff: (t1: Time, t2: Time) => number;
export interface CtxProps {
    nChannels?: number;
    sampleRate?: number;
    fps?: number;
    bitDepth?: number;
}
export declare class SSRContext extends EventEmitter {
    encoder: Encoder;
    nChannels: number;
    playing: boolean;
    sampleRate: number;
    fps: number;
    lastFrame: Time;
    output: Writable;
    frameNumber: number;
    inputs: AudioDataSource[];
    bitDepth: number;
    static fromWAVFile: (path: string) => SSRContext;
    static fromFileName: (filename: string) => SSRContext;
    static defaultProps: CtxProps;
    end: number;
    decoder: Decoder;
    constructor(props?: CtxProps);
    get secondsPerFrame(): number;
    get samplesPerFrame(): number;
    get inputSources(): AudioDataSource[];
    get WAVHeader(): ArrayBuffer;
    encode(buffer: Buffer, value: number, index: number): void;
    get sampleArray(): Uint8ArrayConstructor | Int16ArrayConstructor | Uint32ArrayConstructor;
    pump(): boolean;
    prepareUpcoming(): void;
    get blockSize(): number;
    get currentTime(): number;
    get bytesPerSecond(): number;
    connect(destination: Writable): void;
    start: () => void;
    getRms(): void;
    stop(second?: number): void;
    run(): void;
}
export {};
