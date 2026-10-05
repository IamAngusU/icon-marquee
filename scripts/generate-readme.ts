import { loadIcons } from "../src/utils/load";
import { iconNames } from "../src/utils/registry";
import { renderIconMarquee } from "../src/utils/render";

const featured = [
  "js",
  "ts",
  "react",
  "nextjs",
  "vue",
  "svelte",
  "astro",
  "tailwind",
  "vite",
  "bun",
  "nodejs",
  "deno",
  "python",
  "go",
  "rust",
  "zig",
  "java",
  "kotlin",
  "swift",
  "csharp",
  "php",
  "ruby",
  "docker",
  "kubernetes",
  "terraform",
  "cloudflare",
  "aws",
  "postgres",
  "mongodb",
  "redis",
  "git",
  "github",
  "figma",
];
const compact = [
  "blender",
  "unity",
  "godot",
  "unrealengine",
  "adobephotoshop",
  "adobeillustrator",
  "davinciresolve",
  "krita",
  "cinema4d",
  "affinity",
  "sketch",
  "framer",
];
const sample = [...new Set(featured)];
for (
  let cursor = 37;
  sample.length < 72;
  cursor = (cursor + 137) % iconNames.length
) {
  const name = iconNames[cursor];
  if (name && !sample.includes(name)) sample.push(name);
}
const assets = await loadIcons(sample.join(","));
if ("error" in assets) throw new Error(assets.error);
const svg = renderIconMarquee(assets.svgs, {
  heightPx: 64,
  gapPx: 16,
  widthPx: 912,
  speedPxPerS: 40,
  order: "shuffle",
  seed: 509938,
  edgeFade: 24,
});
await Bun.write(
  new URL("../docs/assets/icon-marquee.svg", import.meta.url),
  svg,
);
const compactAssets = await loadIcons(compact.join(","));
if ("error" in compactAssets) throw new Error(compactAssets.error);
const compactSvg = renderIconMarquee(compactAssets.svgs, {
  heightPx: 52,
  gapPx: 12,
  widthPx: 500,
  speedPxPerS: 30,
  order: "repeat",
  edgeFade: 18,
});
await Bun.write(
  new URL("../docs/assets/icon-marquee-compact.svg", import.meta.url),
  compactSvg,
);
console.log("Generated the README marquees from the app renderer.");
