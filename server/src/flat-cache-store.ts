import { errorMonitor } from "stream";

export class CacheStore {
	cache: Buffer;
	cacheKeys: string[];
	n: number;
	objectbyteLength: number;
	constructor(size: number, objectbyteLength: number) {
		this.cache = Buffer.alloc(objectbyteLength * size);
		this.cacheKeys = Array(size).fill("");
		this.n = 0;
		this.objectbyteLength = objectbyteLength;
	}
	set(key: string, value: Buffer) {
		this.cacheKeys[this.n] = key;
		this.cache.set(value, this.n * this.objectbyteLength);
		this.n++;
	}
	malloc(key: string) {
		this.cacheKeys[this.n] = key;
		const ret = this.cache.slice(
			this.n * this.objectbyteLength,
			this.n * this.objectbyteLength + this.objectbyteLength
		);
		this.n++;
		return ret;
	}
	read(key: string) {
		for (let i = 0; i < this.n; i++) {
			if (this.cacheKeys[i] === key) {
				return this.cache.slice(
					i * this.objectbyteLength,
					i * this.objectbyteLength + this.objectbyteLength
				);
			}
		}
		return null;
	}
	get length() {
		return this.n;
	}
}
export function cacheStore(size: number, objectByteLength: number): CacheStore {
	return new CacheStore(size, objectByteLength);
}
