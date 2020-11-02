import {spawn,execSync,ChildProcess} from 'child_process';
import {PassThrough,Writable}from'stream';
import {Buffer}from'buffer';    
import {unlinkSync}from'fs';
export type CastFunction = ()=>Writable;

export const castInput:CastFunction = ()=>{
    unlinkSync("input2");
    execSync("mkfifo input2");
    const pt = new PassThrough();
    const ff = spawn("ffmpeg", `-debug-level=trace -i pipe:0 -re -f mulaw -f rtp rtp://127.0.0.1:1234`.split(" "));
    pt.pipe(ff.stdin);

    ff.on('error', console.error);
    return pt;
}

export const spawnToBuffer=(proc: ChildProcess): Promise<Buffer>=>{
    return new Promise((resolve,reject)=>{
        const chunks = [];
        proc.stdout.on("data", data=>{
            chunks.push(data);
        })
        proc.on('exit', ()=>{
            resolve(Buffer.concat(chunks))
        });
        proc.on("error",err=>{
            reject(err);
        });
    });
}

export const spawnInputBuffer = (proc:ChildProcess, buffer:Buffer)=>{
    proc.on("error", console.error);
    const pt = new PassThrough();
    pt.pipe(proc.stdin);
    pt.write(buffer);
//    proc.stdin.write(buffer);

}

// spawnToBuffer(spawn("ls")).then(buffer=>{
//    // console.log(buffer.toString());
// }).catch(console.error);

// spawnToBuffer(spawn("ffmpeg",'-i 8.mp3 -f WAV -'.split(' '))).then(buffer=>{
//     console.log(buffer.toString());
// }).catch(console.error);


