export declare const ABTransform: () => TransformStream<Uint8Array, Float32Array>;
export declare const ReadWaveHeader: (view: DataView) => {
    numberOfChannels: number;
    samplesPerSecond: number;
    bytesPerSecond: number;
    bytesPerSample: number;
    bitsPerSample: number;
};
