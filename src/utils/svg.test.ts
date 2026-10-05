import { describe, expect, test } from "bun:test";
import { createMotionTools } from "./motion";
import { rendererSettings } from "./render";
import { scopeIds } from "./scope-ids";
import { createSvgRenderer } from "./svg";

const renderer = createSvgRenderer(
  rendererSettings,
  scopeIds,
  createMotionTools(),
);

const simpleAssets = ["red", "blue", "green"].map(
  (fill) =>
    `<svg width="256" height="256"><rect width="256" height="256" fill="${fill}"/></svg>`,
);
test("ghost edges are transparent, bounded and independent of the moving track", () => {
  const svg = renderer.marquee(simpleAssets, {
    edgeFade: 96,
    widthPx: 80,
    heightPx: 64,
  });
  expect(svg).toContain('offset="0.45"');
  expect(svg).toContain('<g mask="url(#edge-mask)"><g class="track">');
  expect(renderer.marquee(simpleAssets, { edgeFade: 0 })).not.toContain(
    "edge-mask",
  );
  expect(renderer.icons(simpleAssets, { edgeFade: 24 })).not.toContain(
    "edge-mask",
  );
});

test("effect schedules stagger, vary per sweep and target only chosen logos", () => {
  const options = {
    effect: "holo",
    effectTiming: "random",
    effectCoverage: "selected",
    effectIndices: [0, 2],
    effectArea: "border",
    seed: 56,
  } as const;
  const svg = renderer.marquee(simpleAssets, {
    ...options,
    effectIndices: [0, 2],
  });
  expect(svg).toContain('mask="url(#surface-border)"');
  expect(svg).toContain("@keyframes finish-0");
  expect(svg).not.toContain("@keyframes finish-1");
  expect(svg).toContain("@keyframes finish-2");
  expect(svg).toBe(
    renderer.marquee(simpleAssets, { ...options, effectIndices: [0, 2] }),
  );
  const schedules = [...svg.matchAll(/animation:finish-\d+ ([^"]+)/g)].map(
    (match) => match[1],
  );
  expect(new Set(schedules).size).toBe(2);
  expect(svg).toContain("prefers-reduced-motion:reduce");
  expect(svg).not.toContain("<script");
  expect(svg).toContain('d="M-256-640h512v1280h-512z"');
  const angles = [...svg.matchAll(/rotate\(([-\d.]+)deg\)/g)].map(
    (match) => match[1],
  );
  expect(new Set(angles).size).toBeGreaterThan(4);
  expect(svg).toMatch(/translate\([^,]+,[^)]+\) rotate\(/);
  expect(svg).not.toContain('x="-128" width="512"');
  expect(
    new Set([...svg.matchAll(/--finish-delay:([^s]+s)/g)].map((m) => m[1]))
      .size,
  ).toBeGreaterThan(2);
  const stagger = renderer.icons(simpleAssets, { effect: "glint" });
  expect(stagger).toContain("rotate(18.00deg)");
  expect(
    new Set([...stagger.matchAll(/--finish-delay:([^s]+s)/g)].map((m) => m[1]))
      .size,
  ).toBe(3);
  const sync = renderer.icons(simpleAssets, {
    effect: "glint",
    effectTiming: "sync",
  });
  expect([...sync.matchAll(/--finish-delay:/g)].length).toBe(0);
});

test("optional hover labels cannot insert markup", () => {
  const svg = renderer.icons(simpleAssets, { labels: ['<script>"&'] });
  expect(svg).toContain("&lt;script&gt;&quot;&amp;");
  expect(svg).not.toContain("<script>");
});

describe("shuffle renderer", () => {
  test("keeps recent icons apart with a balanced distribution", () => {
    const sequence = renderer.shuffled(6, 1234);
    expect(sequence).toHaveLength(6 * rendererSettings.shufflePasses);
    for (let i = 0; i < sequence.length; i++)
      for (let distance = 1; distance <= 3; distance++)
        expect(sequence[i]).not.toBe(
          sequence[(i - distance + sequence.length) % sequence.length],
        );
    const totals = Array.from(
      { length: 6 },
      (_, icon) => sequence.filter((value) => value === icon).length,
    );
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(2);
    expect(
      new Set(
        Array.from({ length: 16 }, (_, i) =>
          sequence.slice(i * 6, i * 6 + 6).join(","),
        ),
      ).size,
    ).toBeGreaterThan(1);
  });

  test("a seed reproduces an export and different seeds change its order", () => {
    expect(renderer.shuffled(8, 0)).toEqual(renderer.shuffled(8, 0));
    expect(renderer.shuffled(8, 0)).not.toEqual(renderer.shuffled(8, 1));
    expect(renderer.shuffled(1, 4294967295)).toEqual(Array(16).fill(0));
  });

  test("exports a script-free loop with reusable, unique definitions", () => {
    const asset =
      '<svg width="256" height="256"><path id="mark" d="M0 0h256v256z"/></svg>';
    const svg = renderer.marquee(
      [
        asset,
        asset.replace('id="mark"', 'id="second"'),
        asset.replace('id="mark"', 'id="third"'),
      ],
      {
        heightPx: 64,
        gapPx: 16,
        widthPx: 760,
        speedPxPerS: 40,
        order: "shuffle",
        seed: 42,
      },
    );
    expect(svg).toContain("translateX(-15360px)");
    expect(svg).toContain("scroll 96.00s linear infinite");
    expect(svg.match(/<g id="asset-/g)).toHaveLength(3);
    expect(svg.match(/<use href=/g)).toHaveLength(96);
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("animation-play-state");
  });

  test("shuffle deduplicates identical sources; repeat keeps deliberate duplicates", () => {
    const asset = '<svg width="256" height="256"><title>A</title></svg>';
    expect(
      renderer
        .marquee([asset, asset], { order: "shuffle" })
        .match(/<g id="asset-/g),
    ).toHaveLength(1);
    expect(
      renderer
        .marquee([asset, asset], { order: "repeat" })
        .match(/<g id="asset-/g),
    ).toHaveLength(2);
  });

  test("loop seams respect the cooldown across sizes and seeds", () => {
    for (const count of [2, 3, 4, 5, 6, 9, 20])
      for (let seed = 0; seed < 20; seed++) {
        const sequence = renderer.shuffled(count, seed);
        const cooldown = Math.floor(count / 2);
        for (let i = 0; i < sequence.length; i++)
          for (let d = 1; d <= cooldown; d++) {
            if (
              sequence[i] ===
              sequence[(i - d + sequence.length) % sequence.length]
            )
              throw new Error(
                `Repeated icon: count ${count}, seed ${seed}, position ${i}`,
              );
          }
      }
  });
});
