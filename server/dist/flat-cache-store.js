"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStore = exports.CacheStore = void 0;
const fs_1 = require("fs");
class CacheStore {
    constructor(size, objectbyteLength, file) {
        this.cache = Buffer.alloc(objectbyteLength * size);
        this.cacheKeys = Array(size).fill("");
        this.n = 0;
        this.rfd = file;
        this.objectbyteLength = objectbyteLength;
        if (file && fs_1.existsSync(file + ".cache.keys")) {
            this.cacheKeys = fs_1.readFileSync(file + ".cache.keys")
                .toString()
                .split("|");
            this.cache = fs_1.readFileSync(file + ".cache.pcm");
        }
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
    persist() {
        fs_1.writeFileSync(this.rfd + ".cache.pcm", this.cache);
        fs_1.writeFileSync(this.rfd + ".cache.keys", this.cacheKeys.join("|"));
    }
}
exports.CacheStore = CacheStore;
function cacheStore(size, objectByteLength) {
    return new CacheStore(size, objectByteLength);
}
exports.cacheStore = cacheStore;
//# sourceMappingURL=flat-cache-store.js.map