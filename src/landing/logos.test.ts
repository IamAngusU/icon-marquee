import { expect, test } from "bun:test";
import { readLocalLogo } from "./logos";

test("rejects unsupported and oversized logos before image decoding", async () => {
  await expect(
    readLocalLogo(new File(["hello"], "notes.txt"), 20, 256),
  ).rejects.toThrow("Choose an SVG");
  await expect(
    readLocalLogo(new File(["too large"], "logo.png"), 3, 256),
  ).rejects.toThrow("keep logos under");
});
