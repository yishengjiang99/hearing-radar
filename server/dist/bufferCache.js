"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStore = exports.CacheStore = void 0;
class CacheStore {
    constructor(size, objectbyteLength, file) {
        this.cache = Buffer.alloc(objectbyteLength * size);
        this.cacheKeys = Array(size).fill("");
        this.n = 0;
        this.objectbyteLength = objectbyteLength;
    }
    set(key, value) {
        this.cacheKeys[this.n] = key;
        this.cache.set(value, this.n * this.objectbyteLength);
        this.n++;
    }
    malloc(key) {
        this.cacheKeys[this.n] = key;
        const ret = this.cache.slice(this.n * this.objectbyteLength, this.n * this.objectbyteLength + this.objectbyteLength);
        this.n++;
        return ret;
    }
    read(key) {
        for (let i = 0; i < this.n; i++) {
            if (this.cacheKeys[i] === key) {
                return this.cache.slice(i * this.objectbyteLength, i * this.objectbyteLength + this.objectbyteLength);
            }
        }
        return null;
    }
    get length() {
        return this.n;
    }
}
exports.CacheStore = CacheStore;
function cacheStore(size, objectByteLength) {
    return new CacheStore(size, objectByteLength);
}
exports.cacheStore = cacheStore;
//# sourceMappingURL=bufferCache.js.map