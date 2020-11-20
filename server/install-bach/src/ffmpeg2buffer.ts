export const cspawnToBuffer = async (cmd: string, str: string, ob: Buffer) => {
  await new Promise((resolve, reject) => {
    const { stdout, stderr } = require("child_process").spawn(cmd, str.split(" "));
    let offset = 0;
    stdout.on("data", (chunk) => {
      if (offset + chunk.byteLength > ob.byteLength) {
        console.trace();
        console.log(offset, chunk.byteLength, ob.byteLength);
      } else {
        ob.set(chunk, offset);
        offset += chunk.byteLength;
      }
    });
    stdout.on("error", reject);
    stderr.pipe(process.stdout);
    stdout.on("end", resolve);
  });
};
