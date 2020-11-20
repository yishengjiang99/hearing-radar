import { __awaiter } from "tslib";
import { ReadWaveHeader } from "./xforms";
export const fetchsource = (url, srb) => __awaiter(void 0, void 0, void 0, function* () {
    const highWaterMark = 1024 * 12;
    const rs = (yield fetch(url)).body;
    const reader = rs.getReader();
    let first = true;
    let abort = false;
    reader.read().then(function process({ done, value }) {
        if (done || abort)
            return;
        let ab = value.buffer;
        if (first) {
            srb.meta = ReadWaveHeader(new DataView(ab));
            first = false;
            ab = ab.slice(48);
        }
        srb.write(value.buffer);
        if (srb.availableFrames > highWaterMark) {
            srb.waitForDrain();
        }
        reader.read().then(process);
    });
    return srb;
});
//# sourceMappingURL=pull.js.map