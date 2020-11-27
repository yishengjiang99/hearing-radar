import { listFiles } from "./pcm";
import { expect } from "chai";
describe("list files", () => {
  it("ss", () => {
    listFiles("midifiles").on("data", (d) => {
      expect(d.toString()).to.contain("midi");
    });
  });
});
