declare const Fifo: () => {
	read: (size: number) => Uint8Array;
	write: (arr: Uint8Array) => void;
	available_frames: () => number;
};
export default Fifo;
