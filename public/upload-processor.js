
const bufferSampleSize = 2 << 11;
const sizePerSample = 4;
class UploadProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffers=[];
        this.port.postMessage("initialized");
        this.port.onmessage=({data})=>{
            this.buffers.push(data);
        }
    }
    process(inputs, outputs, parameters) {
        if(!inputs[0] || !inputs[0][0]) return true;
        outputs = outputs[0];
        const input = inputs[0];
        if(input[0]) this.port.postMessage(input[0].buffer);
        if(this.buffers.length){
            const outputBuffer = this.buffers.shift();
            outputs[0][1] = new Float32Array(outputBuffer);
        
        }
        return true;
    }
}
registerProcessor("upload-processor", UploadProcessor);