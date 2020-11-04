import { PassThrough } from "stream";
import { MemoryWritable } from "./memory-writable";
import { ReadlineTransform } from "./readline-transform";
import { expect } from "chai";
describe("readline-transform", () => {
	it("breaks buffer/texts into lines", (done) => {
		const readStream = new PassThrough();
		const transform = new ReadlineTransform();
		const writeStream = new MemoryWritable();

		writeStream.on("finish", () => {
			expect(writeStream.data).deep.eq(["foo", "bar", "baz"]);
			done();
		});

		readStream.pipe(transform).pipe(writeStream);

		readStream.write(Buffer.from("foo\nba"));
		readStream.write(Buffer.from("r"));

		readStream.end(Buffer.from("\nbaz"));
	});
	it("auto expends buffer for longer iens", (done) => {
		const readStream = new PassThrough();
		const transform = new ReadlineTransform();
		const writeStream = new MemoryWritable();
		writeStream.on("finish", () => {
			expect(writeStream.data.length).to.equal(3);
			done();
		});

		readStream.pipe(transform).pipe(writeStream);
		const line1 = Buffer.allocUnsafe(1025).fill(1);
		expect(transform.size).to.equal(1024);

		readStream.write(line1);
		expect(transform.size).to.equal(1024 * 3);
		readStream.write("11\n");
		readStream.end("11\n22");
	});
	it("works on hex", (done) => {
		const readStream = new PassThrough();
		const transform = new ReadlineTransform();
		const writeStream = new MemoryWritable();
		writeStream.on("finish", () => {
			expect(writeStream.data.length).to.equal(2);
			done();
		});

		readStream.pipe(transform).pipe(writeStream);

		readStream.end(Buffer.from([0x01, 0x02, 0x03, 0x0a, 0x12]), "hex");
	});
});
