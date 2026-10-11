import { createHash } from "node:crypto";
import { copyFile, mkdir } from "node:fs/promises";
import { createLandingPage } from "../src/landing";
import { logoSvg } from "../src/landing/logo";
import { createClientScript } from "../src/landing/script";
import { llmsText } from "../src/llms";

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
    /<noscript>[\s\S]*?<\/noscript>/,
    "<noscript><p>The generator needs JavaScript. No files are uploaded.</p></noscript>",
  );
await Bun.write("dist/index.html", html);
await Bun.write("dist/logo.svg", logoSvg);
await Bun.write(
  "dist/llms.txt",
  llmsText(
    (process.env.PUBLIC_BASE_URL ?? "https://angusu.de/icon-marquee").replace(
      /\/$/,
      "",
    ),
  ),
);
await Bun.write("dist/.nojekyll", "");
for await (const file of new Bun.Glob("*").scan("public/icons")) {
  await copyFile(`public/icons/${file}`, `dist/icons/${file}`);
}
await copyFile("LICENSE", "dist/LICENSE");
await copyFile("ATTRIBUTION.md", "dist/ATTRIBUTION.md");
console.log(
  "Built generator in dist/ (Manual is portable; GitHub Auto needs same-origin /api).",
);
