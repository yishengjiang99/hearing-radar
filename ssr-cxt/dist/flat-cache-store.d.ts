/// <reference types="node" />
export declare class CacheStore {
    cache: Buffer;
    cacheKeys: string[];
    n: number;
    objectbyteLength: number;
    rfd: string;
    constructor(size: number, objectbyteLength: number, file?: string);
    set(key: string, value: Buffer): void;
    malloc(key: string): Buffer;
    read(key: string): Buffer;
    get length(): number;
    persist(): void;
}
export declare function cacheStore(size: number, objectByteLength: number): CacheStore;
