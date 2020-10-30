
const Fifo = require("./fifo.wasmodule");

const f = Fifo(1024);
f.write(new Uint8Array([1,2,3,4]));
const arr=f.read(3);
console.log(f.available())
function asserts(test, statement){
    if(statement===false) throw new Error('test failed '+test);
}
asserts('t1',arr[0]===1);
asserts('t2', arr[1]===2);

asserts('t3', f.available()===1);

