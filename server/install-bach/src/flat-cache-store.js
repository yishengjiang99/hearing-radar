"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheStore = exports.CacheStore = void 0;
var fs_1 = require("fs");
var CacheStore = /** @class */ (function () {
    function CacheStore(size, objectbyteLength, file) {
        this.cache = Buffer.alloc(objectbyteLength * size);
        this.cacheKeys = Array(size).fill("");
        this.n = 0;
        this.objectbyteLength = objectbyteLength;
        if (file) {
            this.rfd = file;
            this.cacheKeys = fs_1.readFileSync(file + ".cache.keys")
                .toString()
                .split("|");
            this.cache = fs_1.readFileSync(file + ".cache.pcm");
        }
    }
    CacheStore.prototype.set = function (key, value) {
        this.cacheKeys[this.n] = key;
        this.cache.set(value, this.n * this.objectbyteLength);
        this.n++;
    };
    CacheStore.prototype.malloc = function (key) {
        this.cacheKeys[this.n] = key;
        var ret = this.cache.slice(this.n * this.objectbyteLength, this.n * this.objectbyteLength + this.objectbyteLength);
        this.n++;
        return ret;
    };
    CacheStore.prototype.read = function (key) {
        for (var i = 0; i < this.n; i++) {
            if (this.cacheKeys[i] === key) {
                return this.cache.slice(i * this.objectbyteLength, i * this.objectbyteLength + this.objectbyteLength);
            }
        }
        return null;
    };
    Object.defineProperty(CacheStore.prototype, "length", {
        get: function () {
            return this.n;
        },
        enumerable: false,
        configurable: true
    });
    CacheStore.prototype.persist = function () {
        fs_1.writeFileSync(this.rfd + ".cache.pcm", this.cache);
        fs_1.writeFileSync(this.rfd + ".cache.keys", this.cacheKeys.join("|"));
    };
    return CacheStore;
}());
exports.CacheStore = CacheStore;
function cacheStore(size, objectByteLength) {
    return new CacheStore(size, objectByteLength);
}
exports.cacheStore = cacheStore;
