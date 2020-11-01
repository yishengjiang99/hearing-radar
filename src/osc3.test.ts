/* eslint-disable @typescript-eslint/indent */
import { osc3 } from "./osc3";
import { getCtx } from "./ctx";
import { getDiv, timeseries } from "./timeseries";

describe("play sound", () => {
	it("ss", (done) => {
		const offc = new OfflineAudioContext({
			length: 1024*16,
			numberOfChannels: 1,
			sampleRate: 8000
		});
		const i = 0;
		osc3(440, { ctx: offc, when: 0, duration: 3, adsr: [0.5, 0.2, 0.3, 0.4] })
			.connect(new GainNode(offc, { gain: 1 }))
			.connect(offc.destination);
		offc.startRendering().then(audiobuffer => {
			const flarr = audiobuffer.getChannelData(0);
			getDiv("offc-t1");
			timeseries(flarr, "offc-t1");
			done();
		});
	}).timeout(44444);

	it("ggg", (done) => {
		const offc = new OfflineAudioContext({
			length: 1024*16,
			numberOfChannels: 1,
			sampleRate: 8000
		});
		const i = 0;
		osc3(440, { ctx: offc, when: 0, duration: 3, adsr: [0.1, 0.8, 0.3, 0.4] })
			.connect(new GainNode(offc, { gain: 1 }))
			.connect(offc.destination);
		offc.startRendering().then(audiobuffer => {
			const flarr = audiobuffer.getChannelData(0);
			getDiv("offc-gg");
			timeseries(flarr, "offc-gg");
			done();
		});

	}).timeout(44444);
});
