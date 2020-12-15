import { LSSource, LSGraph } from "grep-transform";
import { Transform } from "stream";
let folder;
LSSource("./midisf")
  .pipe(process.stdout)
  .pipe(
    new Transform({
      transform: (chunk, enc, cb) => {
        let str = chunk.toString();
        let m;
        if ((m = str.match(/\.\/w+:/))) {
          folder = m[1];
          str = str.substring(m.index);
        }
        cb();
      },
    })
  );
