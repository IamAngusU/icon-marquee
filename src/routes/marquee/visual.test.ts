import { expect, test } from "bun:test";
import { marqueeRoutes } from ".";

test("visual controls render and forced themes remove automatic media rules", async () => {
  const res = await marqueeRoutes.request(
    "/?i=github,react&effect=glint&intensity=25.5&effectDuration=4&theme=dark",
  );
  expect(res.status).toBe(200);
  const svg = await res.text();
  expect(svg).toContain("@keyframes glint");
  expect(svg).toContain('stop-opacity="0.255"');
  expect(svg).toContain("@media not all");
  expect(svg).not.toContain("prefers-color-scheme:");
});

test("invalid visual values are rejected before reaching SVG markup", async () => {
  for (const query of [
    "effect=bad",
    "effect=%3Cscript%3E",
    "theme=night",
    "intensity=101",
    "effectDuration=0",
    "effectDuration=Infinity",
  ]) {
    expect((await marqueeRoutes.request(`/?i=js&${query}`)).status).toBe(400);
  }
});
