export declare class SharedRingBuffer {
    pt: SharedArrayBuffer;
    state: Uint32Array;
    data: Float32Array;
    dataDecimal: Uint32Array;
    size: number;
    constructor(size: number);
    get wptr(): number;
    get rptr(): number;
    set wptr(val: number);
    set rptr(val: number);
    writeAB(vals: ArrayBuffer): void;
    read(): Float32Array;
    get writableAB(): WritableStream<ArrayBuffer>;
    get writable(): WritableStream<Float32Array>;
    get readable(): ReadableStream<Float32Array>;
}
