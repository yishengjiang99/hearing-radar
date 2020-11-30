/// <reference types="node" />
import { SSRContext } from "./ssrctx";
import { Readable } from "stream";
export interface AudioDataSource {
    ctx: SSRContext;
    active: boolean;
    pullFrame: () => Buffer;
    connect: (destination: SSRContext) => boolean;
    start: (when?: number) => void;
    stop: (when?: number) => void;
    prepare?: (currentTime: number) => void;
    ended: () => boolean;
}
export interface ScheduledDataSource extends AudioDataSource {
    start: (when?: number) => void;
    stop: (when?: number) => void;
}
export declare class Oscillator implements AudioDataSource {
    ctx: SSRContext;
    frequency: any;
    active: boolean;
    bytesPerSample: number;
    _ended: boolean;
    constructor(ctx: SSRContext, { frequency, }: {
        frequency: number;
    });
    get header(): Buffer;
    pullFrame(): Buffer;
    start(): void;
    stop(): void;
    connect(dest: SSRContext): boolean;
    ended(): boolean;
}
export declare class FileSource extends Readable implements ScheduledDataSource {
    offset: number;
    fd: number;
    ctx: SSRContext;
    active: boolean;
    output: Buffer;
    wptr: number;
    _ended: boolean;
    size: number;
    constructor(ctx: SSRContext, { filePath, }: {
        filePath: string;
    });
    start: (when?: number) => void;
    prepare?: (currentTime: number) => void;
    pullFrame(): Buffer;
    connect(dest: SSRContext): boolean;
    stop(): void;
    ended(): boolean;
}
export declare type BufferSourceProps = {
    buffer?: Buffer;
    getBuffer?: () => Buffer;
    start: number;
    end: number;
};
export declare class BufferSource extends Readable implements ScheduledDataSource {
    _start: number;
    _end: number;
    _getBuffer: () => Buffer;
    ctx: SSRContext;
    buffer: Buffer;
    constructor(ctx: SSRContext, props: BufferSourceProps);
    prepare(): void;
    start(when?: number): void;
    stop(when?: number): void;
    get active(): boolean;
    pullFrame(): Buffer;
    connect(dest: SSRContext): boolean;
    ended(): boolean;
    dealloc(): void;
}
