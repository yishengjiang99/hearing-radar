// import { ScheduledDataSource, BufferSource } from "./audio-data-source";
// import { spawnInputBuffer } from "./ffmpeg-link";
// import { SSRContext } from "./ssrctx";

// const tickToTime = (t: tick) => t / 1000;

// export const sequence = (ctx: SSRContext, list: MidiNote[]) => {
// 	list.forEach((note) => {
// 		new BufferSource(ctx, {
// 			start: tickToTime(note.start),
// 			end: tickToTime(note.start + note.duration),
// 			loadBuffer:()=>{
// 				const ob = Buffer.alloc()
// 				cspawnToBuffer("ffmpeg",
// 				`-i db/${note.instrument}/${note.midi}.mp3 -`, )
// 			}
// 		});
// 	});
// };
