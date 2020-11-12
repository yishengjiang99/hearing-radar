import { expect } from "chai";
import { SharedRingBuffer } from "./shared-ring-buffer";
import { ABTransform } from "./xforms";

describe("shared-ringbuffer", () => {
	it("it has a data array and state array", () => {
		const sbr = new SharedRingBuffer(12);
		expect(sbr.state.byteLength).to.equal(
			2 * Uint32Array.BYTES_PER_ELEMENT
		);
		expect(sbr.data.byteLength).to.equal(
			12 * Float32Array.BYTES_PER_ELEMENT
		);
	});
	it("reads and writes float32", () => {
		const sbr = new SharedRingBuffer(4);
		const farr = new Float32Array([1.0, 1.0, 1.0]);
		const ab = farr.buffer;
		sbr.writeAB(ab);
		expect(sbr.wptr).to.equal(3);
		expect(sbr.read()).to.deep.equal(farr);
		expect(sbr.rptr).to.equal(3);
	});
	it("writing fl32", (done) => {
		const sbr = new SharedRingBuffer(10240);
		const ab = sbr.prealloc(2);
		expect(ab.length).to.equal(2);
		expect(ab).instanceOf(Float32Array);
		ab[1] = 0x80;
		ab[0] = 0x64;
		expect(sbr.wptr).to.equal(2);
		done();
	});
	it("writing to buffer", (done) => {
		const sbr = new SharedRingBuffer(10240);
		sbr.writeAB(Buffer.allocUnsafe(1024).buffer);
		sbr.readToArray(
			new Float32Array(1024 / Float32Array.BYTES_PER_ELEMENT).buffer
		);
		expect(sbr.rptr).to.equal(1024 / Float32Array.BYTES_PER_ELEMENT);
		expect(sbr.wptr).to.equal(sbr.rptr);
		done();
	});

	it.skip("provides a writable stream", (done) => {
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
