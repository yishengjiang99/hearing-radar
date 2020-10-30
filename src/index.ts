import { initUploader } from './run';
const stdoutdiv = document.querySelector("#stdout");
const rx1Div = document.getElementById("rx1");
const stdoutBuffer = [];
let rx1 = '';
function render(){
    if(stdoutdiv) stdoutdiv.innerHTML=stdoutBuffer.map(str=>`<br>${str}`).join("");
}
const postRx1 = (str)=>{
    if(rx1===str) return;
    rx1 = str;
    requestAnimationFrame(()=>{
        rx1Div ? rx1Div.innerHTML = rx1 : null ;
    })
}
const stdout = (str)=> {
    stdoutBuffer.push(str);
    if(stdoutBuffer.length>50) stdoutBuffer.shift();
        render();
    }

    const stdin = document.querySelector("input");
    let upcursor = 0;
    window.onkeydown=(e:KeyboardEvent)=>{
    stdin.focus();
    if(e.key==='Enter'){
        stdout(stdin.value );
        stdin.value = "";
        upcursor=0;
    }

    if(e.key === 'ArrowUp' || e.key==='ArrowDown'){
        e.key === 'ArrowUp' && upcursor++;
        e.key === 'ArrowDown' && upcursor--;
        if(upcursor>0){
            stdin.value = stdoutBuffer[stdoutBuffer.length-upcursor];
        }
    }
}

window.onload=()=>{
    document.body.addEventListener("click", async ()=>{
        const ctx = new AudioContext({sampleRate:8000});
        // const uploadPath = await initUploader(ctx, stdout, postRx1);
    },{once:true});
    stdout("welcome. click anywhere to load audio ctx");
};