/* eslint-disable no-console */
import { outputBuffer, renderAudioBuffer } from "./outputBuffer";
import { getCtx } from "./ctx";
import { expect } from "chai";

describe("getOutputBuffer", () => {
	it("it is an script processor", async () => {
		const ctx = getCtx();
		const offCtx=new OfflineAudioContext({ numberOfChannels: 1, sampleRate: 8000, length: 800 });
		const ab: AudioBuffer = await renderAudioBuffer(new ConstantSourceNode(offCtx), { numberOfChannels: 1, sampleRate: 8000, length: 800 });
		expect(ab.duration).to.equal(0.1);
		expect(ab.getChannelData(0)[0]).to.equal(0);
	});
});
