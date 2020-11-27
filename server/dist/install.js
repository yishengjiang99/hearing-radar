"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadSoundFonts = void 0;
const execSync = require("child_process").execSync;
exports.downloadSoundFonts = () => {
    const sfUrl = (setname, fontname) => `https://gleitz.github.io/midi-js-soundfonts/${setname}/${fontname}-mp3.js`;
    const format = (str) => str
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(" ", "_")
        .replace(")", "")
        .replace("(", "");
    const setname = "FatBoy";
    execSync(`[[ -d mp3 ]] || mkdir mp3`);
    execSync(`[[ -d midisf ]] || mkdir midisf`);
    for (const name of execSync("cat ./db/csv/* |cut -f2 -d','|sort |uniq")
        .toString()
        .trim()
        .split("\n")) {
        const fontname = format(name);
        const localname = "db/" + setname + "_" + fontname + ".js";
        execSync(`curl "${sfUrl(setname, fontname)}" -o - > ${localname}`);
        execSync(`grep 'data:audio/mp3;base64' ${localname} |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\",' '\n'|grep -v ^$ |base64 --decode > mp3/${setname}_${fontname}.mp3`);
        const folder = "db/" + fontname;
        execSync(`[[ -d "${folder}" ]] || mkdir '${folder}'`);
        for (let i = 0; i < 88; i++) {
            const name = `${i + 21}.mp3`;
            const res = execSync(`/bin/dd bs=${887832 / 88} if=./mp3/FatBoy_${fontname}.mp3 skip=${i} count=1 of=./${folder}/${i}.mp3`).toString();
        }
    }
};
exports.downloadSoundFonts();
//# sourceMappingURL=install.js.map