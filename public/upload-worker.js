let messagePort;
let websocketPort;

const initWsPort =  ()=>{
    return new Promise((resolve,reject)=>{
        if(websocketPort) return resolve(websocketPort);

        // websocketPort = new WebSocket("wss://grepawk.com/proxy");
         websocketPort = new WebSocket("ws://localhost:5150");

         websocketPort.onopen = ()=>{
            websocketPort.send("test");
            websocketPort.onmessage=()=>resolve(websocketPort);
        }
    })
}
function float32ToInt16(float32array) {
    let l = float32array.length;
    const buffer = new Int16Array(l);
    while (l--) {
      buffer[l] = Math.min(1, float32array[l]) * 0x7fff;
    }
    return buffer;
  }

onmessage = async ({data})=> {
    if(!data.port) return;
    messagePort = data.port;
    postMessage({msg:'port got'});
    const ws = await initWsPort();

    messagePort.onmessage=({data})=>{
        ws.send(float32ToInt16(data));
    }
    ws.onmessage = ({data}) => postMessage({rx1:data})


 };
