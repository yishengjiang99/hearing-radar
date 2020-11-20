import { __asyncGenerator, __asyncValues, __await, __awaiter } from "tslib";
import { parseMidiCSV } from "./parseMidi";
let ctx;
const btn = document.createElement("button");
btn.textContent = "start";
const cacheStore = {};
btn.addEventListener("click", () => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    ctx = new AudioContext();
    let t0;
    const g = new GainNode(ctx);
    g.connect(ctx.destination);
    const csv = yield (yield fetch("/db/midi.csv")).text();
    const lines = csv.split("\n");
    try {
        for (var _b = __asyncValues((function () {
            return __asyncGenerator(this, arguments, function* () {
                while (lines.length) {
                    const note = parseMidiCSV(lines.shift());
                    if (t0 && note.start > ctx.currentTime - t0 + 5.0) {
                        yield __await(new Promise((resolve) => setTimeout(resolve, 3.0)));
                    }
                    const url = `/db/Fatboy_${note.instrument}/${note.note}.mp3`;
                    note.buffer =
                        cacheStore[url] ||
                            (yield __await(fetch(url)
                                .then((res) => res.arrayBuffer())
                                .then((ab) => ctx.decodeAudioData(ab))
                                .catch((e) => alert(e.message + url))));
                    cacheStore[url] = cacheStore[url] || note.buffer;
                    yield yield __await(note);
                }
            });
        })()), _c; _c = yield _b.next(), !_c.done;) {
            const note = _c.value;
            t0 = t0 || ctx.currentTime;
            const abs = new AudioBufferSourceNode(ctx, { buffer: note.buffer });
            document.body.innerHTML = "starting at " + note.start + t0;
            abs.start(note.start);
            abs.stop(note.start + note.duration + t0);
            abs.connect(g);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}));
document.body.appendChild(btn);
//# sourceMappingURL=mixer.js.map