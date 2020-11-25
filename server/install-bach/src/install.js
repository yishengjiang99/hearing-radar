"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadSoundFonts = void 0;
var execSync = require("child_process").execSync;
exports.downloadSoundFonts = function () {
    var sfUrl = function (setname, fontname) {
        return "https://gleitz.github.io/midi-js-soundfonts/" + setname + "/" + fontname + "-mp3.js";
    };
    var format = function (str) {
        return str
            .replace(" ", "_")
            .replace(" ", "_")
            .replace(" ", "_")
            .replace(" ", "_")
            .replace(")", "")
            .replace("(", "");
    };
    var setname = "FatBoy";
    execSync("[[ -d mp3 ]] || mkdir mp3");
    execSync("[[ -d midisf ]] || mkdir midisf");
    for (var _i = 0, _a = execSync("cat ./db/csv/* |cut -f2 -d','|sort |uniq")
        .toString()
        .trim()
        .split("\n"); _i < _a.length; _i++) {
        var name_1 = _a[_i];
        var fontname = format(name_1);
        var localname = "db/" + setname + "_" + fontname + ".js";
        execSync("curl \"" + sfUrl(setname, fontname) + "\" -o - > " + localname);
        execSync("grep 'data:audio/mp3;base64' " + localname + " |awk -F 'data:audio/mp3;base64,' '{print $2}'|tr '\",' '\n'|grep -v ^$ |base64 --decode > mp3/" + setname + "_" + fontname + ".mp3");
        var folder = "db/" + fontname;
        execSync("[[ -d \"" + folder + "\" ]] || mkdir '" + folder + "'");
        for (var i = 0; i < 88; i++) {
            var name_2 = i + 21 + ".mp3";
            var res = execSync("/bin/dd bs=" + 887832 / 88 + " if=./mp3/FatBoy_" + fontname + ".mp3 skip=" + i + " count=1 of=./" + folder + "/" + i + ".mp3").toString();
        }
    }
};
exports.downloadSoundFonts();
