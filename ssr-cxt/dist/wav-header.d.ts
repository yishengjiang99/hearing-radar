import { SSRContext } from "./ssrctx";
export declare const wavHeader: (length: any, sampleRate?: number, numChannels?: number, bitDepth?: number) => ArrayBuffer;
export declare const readHeader: (path: string) => SSRContext;
