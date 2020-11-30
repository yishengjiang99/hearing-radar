import { MidiNote } from ".";
import { Transform, TransformCallback } from "stream";
import { BufferSource } from "./audio-data-source";
import { CacheStore } from "./flat-cache-store";
import { loadBuffer } from "./midi-buffer-source";
import { SSRContext } from "./ssrctx";

export class MidiToScheduledBuffer extends Transform {
  noteCache: CacheStore;
  ctx: SSRContext;
  premiumCache: CacheStore;
  constructor(ctx: SSRContext) {
    super({ objectMode: true });
    this.ctx = ctx;
    this.noteCache = new CacheStore(200, ctx.bytesPerSecond, ctx.format);
    this.premiumCache = new CacheStore(12, ctx.bytesPerSecond * 5, ctx.format);
  }
  _transform = async (
    notes: MidiNote[],
    _: BufferEncoding,
    cb: TransformCallback
  ) => {
    notes.map(async (note) => {
      note.buffer = await loadBuffer(
        this.ctx,
        note,
        note.duration < 1 ? this.noteCache : this.premiumCache
      );
      const srb = new BufferSource(this.ctx, {
        buffer: note.buffer,
        start: note.startTime,
        end: note.endTime,
      });
      this.emit("data", srb);
    });
    cb();
  };
  _flush = (cb) => {
    this.noteCache.persist();
    cb(null, null);
  };
}
