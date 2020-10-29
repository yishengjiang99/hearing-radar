import { expect } from "chai";
import { getCtx } from "./ctx";
describe("getCtx", () => {
	it("getctx", () => {
		expect(getCtx()).to.exist;
	});
});
