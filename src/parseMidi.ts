export type tick = number;
export type MidiNote = {
	instrument: string;
	note: number;
	start: tick;
	duration: tick;
	buffer?: AudioBuffer;
};
export const tickToTime = (t: tick) => t / 1000;

export const parseMidiCSV = (line: string): MidiNote => {
	const [instrument, note, _, _2, start, duration] = line.split(",");
	return {
		instrument: instrument
			.replace(" ", "_")
			.replace(" ", "_")
			.replace(" ", "_"),
		note: parseInt(note) - 21,
		start: tickToTime(parseInt(start)),
		duration: tickToTime(parseInt(duration)),
	};
};
