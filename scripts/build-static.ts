import { createHash } from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import { createLandingPage } from "../src/landing";
import { logoSvg } from "../src/landing/logo";
import { createClientScript } from "../src/landing/script";

await mkdir("dist/icons", { recursive: true });
const scriptHash = createHash("sha256")
  .update(createClientScript(true))
  .digest("base64");
const html = createLandingPage(true)
  .replace(
    '<meta charset="utf-8" />',
    `<meta charset="utf-8" /><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'sha256-${scriptHash}'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'" />`,
  )
  .replace(
    '<link rel="alternate" type="text/plain" href="/llms.txt" title="API usage guide" />',
    "",
  )
  .replace(
    '<a href="#reference">API guide</a>',
    '<a href="#reference">How to use</a>',
  )
  .replace(
    /<section id="reference"[\s\S]*?<\/section>/,
    '<section id="reference" class="reference"><div class="reference-intro"><h2>Pick. Download.<br />Paste.</h2><p>Commit the SVG beside your README. No account or hosted API needed.</p></div><div class="reference-content"><div class="endpoint"><code>[![My tech stack](./icon-marquee.svg)](https://github.com/IamAngusU/icon-marquee)</code></div><p class="field-help">One adaptive file for light and dark. Original logos stay vector; your uploaded logos are embedded locally as PNGs.</p></div></section>',
  )
  .replace(
    /<noscript>[\s\S]*?<\/noscript>/,
    "<noscript><p>The generator needs JavaScript. No files are uploaded.</p></noscript>",
  );
await Bun.write("dist/index.html", html);
await Bun.write("dist/logo.svg", logoSvg);
await Bun.write("dist/.nojekyll", "");
for await (const file of new Bun.Glob("*").scan("public/icons")) {
  await copyFile(`public/icons/${file}`, `dist/icons/${file}`);
}
await copyFile("LICENSE", "dist/LICENSE");
await copyFile("ATTRIBUTION.md", "dist/ATTRIBUTION.md");
console.log("Built portable generator in dist/ (no backend required).");
