import { describe, expect, test } from "bun:test";
import { rendererSettings } from "./render";
import { scopeIds } from "./scope-ids";
import { createSvgRenderer } from "./svg";

const renderer = createSvgRenderer(rendererSettings, scopeIds);

describe("shuffle renderer", () => {
  test("uses every icon once per round without adjacent duplicates", () => {
    const sequence = renderer.shuffled(6, 1234);
    expect(sequence).toHaveLength(6 * rendererSettings.shufflePasses);
    for (let i = 0; i < sequence.length; i += 6)
      expect([...sequence.slice(i, i + 6)].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    for (let i = 1; i < sequence.length; i++)
      expect(sequence[i]).not.toBe(sequence[i - 1]);
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
    const svg = renderer.marquee([asset, asset, asset], {
      heightPx: 64,
      gapPx: 16,
      widthPx: 760,
      speedPxPerS: 40,
      order: "shuffle",
      seed: 42,
    });
    expect(svg).toContain("translateX(-15360px)");
    expect(svg).toContain("scroll 96.00s linear infinite");
    expect(svg.match(/<g id="asset-/g)).toHaveLength(3);
    expect(svg.match(/<use href=/g)).toHaveLength(96);
    const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("animation-play-state");
  });
});
