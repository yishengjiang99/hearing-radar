import { cacheStore } from "./flat-cache-store";
// console.log(test);
// test("cache store", function(t){
//     console.log(t);
//     t.plan(2);
//     const cache = cacheStore(100, 3);
//     cache.set("k1", Buffer.from([1,2,3]));
//     const v = cache.read("k1");
//     t.deepEqual(v, Buffer.from([1,2,3]));

//     const floatCache = cacheStore(160, 4);
//     const ob = floatCache.malloc('k2');
//     ob.writeFloatBE(1.2);
//     t.equal(~~(floatCache.read('k2').readFloatBE(0) * 10) ,12);
// });
