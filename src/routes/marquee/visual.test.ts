import { expect, test } from "bun:test";
import { marqueeRoutes } from ".";

test("visual controls render and forced themes remove automatic media rules", async () => {
  const res = await marqueeRoutes.request(
    "/?i=github,react&effect=glint&intensity=25.5&effectDuration=4&theme=dark",
  );
  expect(res.status).toBe(200);
  const svg = await res.text();
  expect(svg).toContain("@keyframes finish-0");
  expect(svg).toContain('class="finish glint"');
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
    "effectArea=script",
    "effectTiming=fast",
    "effectCoverage=untrusted",
    "effectIndices=-1",
    "effectIndices=100",
    "edgeFade=97",
    "effectVariation=NaN",
  ]) {
    expect((await marqueeRoutes.request(`/?i=js&${query}`)).status).toBe(400);
  }
});

test("holo borders, fade and selective timing are supported by the API", async () => {
  const res = await marqueeRoutes.request(
    "/?i=js,ts&effect=holo&effectArea=border&effectTiming=random&effectCoverage=selected&effectIndices=1&edgeFade=24",
  );
  expect(res.status).toBe(200);
  const svg = await res.text();
  expect(svg).toContain('mask="url(#edge-mask)"');
  expect(svg).toContain('mask="url(#surface-border)"');
  expect(svg).toContain("@keyframes finish-1");
  expect(svg).not.toContain("@keyframes finish-0");
});
