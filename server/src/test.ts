require("child_process").spawn("cat", ["pipe/1"]).stdout.pipe(process.stdout);
