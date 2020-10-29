/* eslint-disable no-console */
import { outputBuffer } from "./outputBuffer";
import { osc3 } from "./osc3";
import { getCtx } from "./ctx";

import { timeseries } from "./timeseries";
import { expect } from "chai";
import { asyncVerify } from "run-async";

describe("getOutputBuffer", () => {
	it("it is an script processor", async () => {
		const osc = osc3(322);
		const output = new Float32Array(getCtx().sampleRate);
		const { node, samples } = outputBuffer(osc, {
			outlet: osc.context.destination,
			length: 144,
			output,
		});
		expect(node).to.exist;
		try {
			await samples();
			expect(output[3]).to.not.equal(0);
			expect(output[4]).to.be.greaterThan(output[3]);
		} catch (e) {
			console.log(e);
			expect(e).to.be.null;
		}
	});
});
