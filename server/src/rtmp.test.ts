import { expect } from "chai";
import { wscat } from "grep-wss";
import { RTServer } from "./rtmp";

it("and transport it correctly on server", (done) => {
	RTServer({ port: 2992 }).then((s) => {
		let server = s;
		wscat("localhost", 2992).then(({ stdin, stdout, stderr }) => {
			// stdout.on("data", (d) => {
			// 	const dv = new DataView(d.buffer);
			// 	let i = 0;
			// });
			stderr.pipe(process.stderr);
			process.stdin.pipe(stdin);

			stdin.write(Buffer.from("a"));
			stdout.on("data", (d) => {
				expect(d[0]).to.equal(0x00);
				server.stop();
				server.server.on("close", done);
			});
		});
	});
});
