    const ctx = SSRContext.fromFileName(
      "./samples/billie-ac2-ar-44100-s16le.pcm"
    );
    const file = new FileSource(ctx, {
      filePath: "./samples/billie-ac2-ar-44100-s16le.pcm",
    });
    file.connect(ctx);
    const play = spawn(
      "ffplay",
      "-t 30 -i pipe:0 -ac 2 -ar 44100 -f s16le".split(" ")
    ).stdin;
    ctx.on("data", (d) => {
      play.write(d);
    });
