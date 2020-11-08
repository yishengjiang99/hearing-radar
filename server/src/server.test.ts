import { expect } from "chai";
import { createConnection } from "net";
import { router } from "./server";

describe("router", () => {
	it("routes requests", (done) => {
		const app = require("express")();
		app.use("/", router);
		app.listen(3000);
		const html = require("child_process")
			.execSync(
				`php -r 'echo file_get_contents("http://localhost:3000/");'`
			)
			.toString();
		expect(html).to.include("script");
		done();
	});
});
