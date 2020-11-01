export function cacheStore(size:number, objectByteLength: number){
    let n = 0;
    const cache = Buffer.alloc(objectByteLength*size);
    const cacheKeys = [];
    function read(key){
        for(let i=0; i<n; i++){
            console.log(cacheKeys[i],'vs',key)
            if(cacheKeys[i]===key)  {
//                console.log(i*objectByteLength, i*objectByteLength+objectByteLength);
                return cache.subarray(i*objectByteLength, i*objectByteLength+objectByteLength);
            }
        }
        return null;
    }
    function set(key,value){
        cacheKeys[n] = key;
         cache.set(value, n*objectByteLength);
        n++;
    }
    function malloc(key){
        cacheKeys[n] = key;
    //    console.log(n*objectByteLength, n*objectByteLength+objectByteLength,key);
        const ret= cache.subarray(n*objectByteLength, n*objectByteLength+objectByteLength) 
        n++;
        return ret;

    }
    return {
        read,set,malloc,cache,cacheKeys,n
    }
}