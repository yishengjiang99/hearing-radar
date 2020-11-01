export {};
import { WebSocketServer } from 'grep-wss';


type ReplyFunction = (msg: string | Buffer) => void;

const ppl: ReplyFunction[] = [];
WebSocketServer({
    port: 5150,

    onListening:()=>{
    //    proc = spawn("ffmpeg", `-i pipe:0 -f s16le -ac 1 -ar 8000 `.split(' '));
    //    proc!.stdout!.pipe(output);
    //    console.log("listening on 5150, ffmpeg proc id: ", proc.pid);
    //    proc.stderr?.on('data',d=>console.error(d));
    }, 
    onConnection:(reply)=>{
        ppl.push(reply);

    },
    onData: (data: Buffer,_)=>{
        _(data);

    }
});

