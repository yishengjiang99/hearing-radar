import { expect } from "chai";
import { F32toU32 } from "./kodak";
describe("F32toU32", () => {
	it("converts decimal numbers to f32 array", () => {
		expect(F32toU32(0.1))
	});
});
