/* eslint-disable @typescript-eslint/indent */
import { osc3run } from "./osc3";
import { getCtx } from "./ctx";

describe("play sound", () => {
	it("ss", () => {
		const i = 0;
		osc3run(440, i + 0, 0.3)
			.connect(new GainNode(getCtx(), { gain: 0.0001 }))
			.connect(getCtx().destination);

		osc3run(220, i + 0.5, 0.4)
			.connect(new GainNode(getCtx(), { gain: 0.0001 }))
			.connect(getCtx().destination);
		osc3run(440, i + 1)
			.connect(new GainNode(getCtx(), { gain: 0.001 }))
			.connect(getCtx().destination);
	});
});
