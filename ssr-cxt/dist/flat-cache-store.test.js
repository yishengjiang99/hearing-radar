"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const flat_cache_store_1 = require("./flat-cache-store");
describe("cache store", () => {
    it("instantiates with buffer size, and size of eleemnt", () => {
        const cache = new flat_cache_store_1.CacheStore(100, 3);
        chai_1.expect(cache.length).eq(0);
        cache.malloc("1");
        chai_1.expect(cache.length).eq(1);
    });
    it("instantiates with buffer size, and size of eleemnt", () => {
        const before = process.memoryUsage();
        const cache = new flat_cache_store_1.CacheStore(100, 3);
        const after = process.memoryUsage();
        console.log(after.heapUsed - before.heapUsed);
        chai_1.expect(after.heapUsed - before.heapUsed).greaterThan(0);
    });
});
//# sourceMappingURL=flat-cache-store.test.js.map