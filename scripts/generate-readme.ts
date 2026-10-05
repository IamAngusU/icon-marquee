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
const mark = await Bun.file(
  new URL("../docs/assets/mark.svg", import.meta.url),
).text();
const svg = renderIconMarquee([mark, ...assets.svgs], {
  heightPx: 64,
  gapPx: 20,
  widthPx: 912,
  speedPxPerS: 38,
  order: "shuffle",
  seed: 509938,
  edgeFade: 24,
  effect: "glint",
  effectTiming: "random",
  effectCoverage: "some",
  effectDuration: 2.5,
  effectInterval: 5,
  effectVariation: 60,
  intensity: 24,
});
const row = svg
  .replace("<svg ", '<svg x="44" y="222" ')
  .replace(
    /@media\s*\(prefers-color-scheme:\s*(light|dark)\)/g,
    (_, theme: string) => (theme === "dark" ? "@media all" : "@media not all"),
  );
const hero = `<svg width="1000" height="332" viewBox="0 0 1000 332" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
<title id="title">Icon Marquee — Your stack. In good motion.</title>
<desc id="desc">An animated lineup of development tools and a custom logo. Compose your own self-contained SVG for a README or website.</desc>
<rect width="1000" height="332" rx="24" fill="#1b2845"/>
<g font-family="Arial,Helvetica,sans-serif" fill="#f4f7ff">
<text x="44" y="88" font-size="54" font-weight="700" letter-spacing="-2">Your stack.</text>
<text x="44" y="145" font-size="54" font-weight="700" letter-spacing="-2">In good motion.</text>
<text x="46" y="181" font-size="18" fill="#bdcbe5">1,041 icons. Your own logos. One little SVG.</text>
</g>${row}</svg>`;
await Bun.write(new URL("../docs/assets/hero.svg", import.meta.url), hero);
await Bun.write(
  new URL("../docs/assets/icon-marquee.svg", import.meta.url),
  svg,
);
console.log("Generated README hero and standalone SVG example.");
