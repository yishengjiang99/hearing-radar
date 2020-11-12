const { execSync, execFileSync } = require("child_process");

const loadedfonts = execSync("ls mp3/*.mp3")
  .toString()
  .split(/\s+?/)
  .map((filename:string) => {
    console.log(filename);
    const folder = filename.replace("mp3/FatBoy_", "").replace(".mp3", "");
    execSync(`[[ -d "${folder}" ]] || mkdir '${folder}'`);
 
    for (let i = 0; i < 88; i++) {
        execSync(
        "/bin/dd" +
          ` bs=${
            887832 / 88
          } if=./${filename} skip=${i} count=1 of=./${folder}/${i}.mp3`
      ).toString();
    }
    return filename;
  });