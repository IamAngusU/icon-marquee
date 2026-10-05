import { expect, test } from "bun:test";
import { config } from "../config";
import { createLogoTools } from "./logo-tools";
import { readLocalLogo } from "./logos";

const tools = createLogoTools(config.landing.logoAppearance);

test("rejects unsupported and oversized logos before image decoding", async () => {
  await expect(
    readLocalLogo(new File(["hello"], "notes.txt"), 20, 256, tools),
  ).rejects.toThrow("Choose an SVG");
  await expect(
    readLocalLogo(new File(["too large"], "logo.png"), 3, 256, tools),
  ).rejects.toThrow("keep logos under");
});
