import { use } from "chai";

const reg = /file\/(?<g>\S+)/;

const route = (pattern) => /file\/(?<name>\S+)/;

const w = (str) => process.stdout.write(str);
const m = "/file/abc".match(reg);
console.log(m.groups.g);
