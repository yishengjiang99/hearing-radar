class PlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
    this.started = false;
    // this.fifo = Fifo(1024 * 10);
    this.port.postMessage("initialized");
    this.port.onmessage = async ({ data: { readable } }) => {
      let reader = await readable.getReader();
      let that = this;
      reader.read().then(function process({ done, value }) {
        if (done) {
          that.port.postMessage({ done: 1 });
          return;
        }
        let offset = 0;
        while (value.length >= 128 * 2) {
          that.buffers.push(value.slice(0, 128 * 2));
          value = value.slice(128 * 2);
        }
        that.started = true;
        reader.read().then(process);
      });
    };
  }

  process(inputs, outputs, parameters) {
    if (this.started === false) {
      return true;
    }
    if (this.buffers.length === 0) {
      this.port.postMessage({ loss: 1 });
      return true;
    }

    const dv = this.buffers.shift();
    for (let i = 0; i < 128 * 2; i++) {
      outputs[0][0][i] = dv[i * 2];
      outputs[0][1][i] = dv[i * 2 + 1]; //* 2];
    }
    if (Math.random() < 0.1) {
      const rsum = outputs[0][0].reduce((sum, v, idx) => {
        return (sum += v * v);
      }, 0);

      this.port.postMessage({
        stats: {
          buffered: this.buffers.length,
          rms: Math.sqrt(rsum / 128),
          loss: this.loss,
        },
      });
    }

    return true;
  }
}
registerProcessor("playback-processor", PlaybackProcessor);
