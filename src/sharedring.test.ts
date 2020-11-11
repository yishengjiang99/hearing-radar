import { expect } from "chai";
import { SharedRingBuffer } from "./shared-ring-buffer";
import { ABTransform } from "./xforms";
describe("shared-ringbuffer", () => {
	it("it has a data array and state array", () => {
		const sbr = new SharedRingBuffer(10240);
		expect(sbr.state.byteLength).to.equal(
			2 * Uint32Array.BYTES_PER_ELEMENT
		);
		expect(sbr.data.byteLength).to.equal(
			10240 * Float32Array.BYTES_PER_ELEMENT
		);
	});
	it("reads and writes float32", () => {
		const sbr = new SharedRingBuffer(10240);
		const farr = new Float32Array([1.0, 1.0, 1.0]);
		const ab = farr.buffer;
		sbr.writeAB(ab);
		expect(sbr.wptr).to.equal(3);
		expect(sbr.read()).to.deep.equal(farr);
		expect(sbr.rptr).to.equal(3);
	});
	it("provides a writable stream", (done) => {
		const sbr = new SharedRingBuffer(10240);
		fetch("http://localhost:3000/synth/440/-ac2-f32le")
			.then((res) => {
				expect(res.status).to.equal(200);
				return res.body;
			})
			.then((rs) => {
				rs.pipeThrough(ABTransform()).pipeTo(sbr.writable);
				expect(sbr.wptr).to.be.greaterThan(0);
				const ab = sbr.read();
				const dv = new DataView(ab);
				expect(dv.getFloat32(0, true)).to.equal(Buffer.from("R"));
				done();
			})
			.then(() => {
				expect(sbr.wptr).to.be.greaterThan(0);
				const ab = sbr.read();
				const dv = new DataView(ab);
				expect(dv.getFloat32(0, true)).to.equal(Buffer.from("R"));
				done();
			})
			.catch((err) => {
				expect(err).to.not.exist;
			});
	});
});
