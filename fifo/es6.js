
module.exports=function(size){
    const ptr = _malloc(0);
    _fifo_init(ptr, size);
    return {
        write: (array)=>{
            const inputPtr = _malloc(array.length*Uint8Array.BYTES_PER_ELEMENT);
            HEAP8.set(array,inputPtr);
            _fifo_write(ptr, inputPtr, array.length);
        },
        read: (length)=>{
            const byteLength = length*Uint8Array.BYTES_PER_ELEMENT;
            const ob = _malloc(byteLength);
            _fifo_read(ptr, ob, byteLength);
            return new Uint8Array(HEAP8.buffer, ob, byteLength);
        },
        available: ()=>{
            return _fifo_size();
        }
    }
}

