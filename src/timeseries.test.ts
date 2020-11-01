import { expect } from "chai";
import { osc3run } from "./osc3";
import { timeseries } from "./timeseries";

describe("timeseries", () => {
	it("plots a timeseries into svg", () => {
		const div=document.createElement("div");
		div.id="paint";
		document.body.appendChild(div);
		timeseries(new Float32Array([1, 2, 3, 4, 1, 2, 3, 4]), "paint");
		expect(document.getElementById("paint").innerHTML).to.include("polyline");
	});
	it.skip("can be used to plot charts", (done) => {
		const div=document.createElement("div");
		div.id="paint2";
		document.body.appendChild(div);
		const postamp = osc3run(440); 
		const analyser = new AnalyserNode(postamp.context);
		postamp.connect(analyser).connect(postamp.context.destination);
		const data = new Float32Array(analyser.fftSize);
		let count = 0;
		let t = performance.now();
		const loop = function() {
			analyser.getFloatTimeDomainData(data);
			timeseries(data, "paint2");
			expect(performance.now()-t).lessThan(100000);
			t=performance.now();
			if (count++>4) {
				done();
			} else {
				requestAnimationFrame(loop);

			}
		};
		loop();
	});
});
