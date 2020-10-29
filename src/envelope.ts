import { ADSR } from "./types";

export function envelope(
	ctx: AudioContext,
	attribute: AudioParam,
	adrs: ADSR,
	startTime: number = ctx.currentTime
): void {
	const [attack, decay, release, sustain] = adrs;
	attribute.setValueAtTime(0, startTime);
	attribute.linearRampToValueAtTime(3, startTime + attack);
	attribute.linearRampToValueAtTime(sustain, startTime + decay);
	attribute.exponentialRampToValueAtTime(1.5, startTime + release);
	attribute.linearRampToValueAtTime(0, startTime + startTime + 5 * release);
}
