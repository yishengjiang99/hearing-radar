// import { expect } from "chai";
// import { ReadStream } from "fs";
// import { createConnection } from "net";
// import { router } from "./server";
// const fetch = require("node-fetch");
// describe("router", () => {
// 	it("routes requests", (done) => {
// 		const app = require("express")();
// 		app.use("/", router);
// 		app.listen(4003);
// 		let _done = done;
// 		const a = fetch("http://localhost:4003/synth/440/f32le-ac2")
// 			.then((res) => {
// 				expect(res).to.exist;
// 				console.log(res.status);
// 			})
// 			.catch((e) => {
// 				expect.fail(e);
// 			})
// 			.finally(() => {
// 				console.log("filenanly");
// 				_done();

// 				app.stop();
// 			});
// 	});
// });
