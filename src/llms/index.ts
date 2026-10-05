import { config } from "../config";
import { iconNames } from "../utils/registry";

const { icons, marquee } = config;

const aliasLines = Object.entries(icons.aliases)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([short, name]) => `- \`${short}\` → \`${name}\``)
  .join("\n");

export function llmsText(origin: string): string {
  return `# icon-marquee

> HTTP API that returns tech-stack icons as SVG: an animated scrolling marquee or a static row. Embed the URL in Markdown or an HTML \`<img>\` tag; no API key, no JavaScript.

Base URL: ${origin}

## Endpoints

### GET /v1/marquee
Animated SVG that scrolls the icons left in a seamless loop at ${marquee.speedPxPerS}px/s. ${icons.heightPx}px tall. Stops for viewers with reduced motion enabled.

Query parameters:
- \`i\` (required): comma-separated icon names or short names, in display order. Max ${icons.maxPerRequest}. Case and surrounding spaces are ignored; duplicates are allowed.
- \`width\` (optional): window width in px, a whole number from 1 to ${marquee.maxWidthPx}. The row repeats to fill it. Without it, the window is at most ${marquee.defaultWidthPx}px, or exactly one row if the row is shorter.
- \`height\` (optional): icon height in px, a whole number from ${icons.minHeightPx} to ${icons.maxHeightPx}. Default ${icons.heightPx}.
- \`gap\` (optional): space between icons in px, a whole number from ${icons.minGapPx} to ${icons.maxGapPx}. If omitted, spacing scales with icon height (44/256 of the height).
- \`speed\` (optional): a whole number from ${marquee.minSpeedPxPerS} to ${marquee.maxSpeedPxPerS} px/s. Default ${marquee.speedPxPerS}.
- \`direction\` (optional): \`left\` (default) or \`right\`.
- \`order\` (optional): \`repeat\` (default) or \`shuffle\`. Shuffle deduplicates identical sources and excludes recently used icons. Exports contain ${marquee.shufflePasses} × unique icon count picks before looping; SVG images cannot run fresh JavaScript randomness.
- \`seed\` (optional): a whole number from 0 to ${marquee.maxSeed}; default ${marquee.defaultSeed}. Reproduces the same shuffled export.

### GET /v1/icons
Static SVG with the icons in one row, left to right in request order. ${icons.heightPx}px tall.

Query parameters:
- \`i\` (required): same rules as above.
- \`height\` and \`gap\` (optional): same rules as above.

### GET /v1/catalog
JSON object containing \`names\` (every canonical icon name) and \`aliases\` (short name to canonical name).

### GET /v1/assets?i=...
JSON containing aligned \`names\` and original \`svgs\` arrays, plus \`unknown\` names. Uses the same name validation and 100-icon limit. Used by the browser composer; only bundled icons are served.

## Responses

- 200 \`image/svg+xml\`, cached for ${icons.cacheMaxAgeS} seconds.
- Unknown names are skipped: the response is still 200 with the known icons, and the skipped names are listed, URL-encoded and comma-separated, in the \`X-Unknown-Icons\` response header.
- 400 \`application/json\` \`{"error": "..."}\` when \`i\` is missing or empty, has more than ${icons.maxPerRequest} names, contains no known name, or any supported option is invalid. Numeric options accept decimal digits only.

## Theme

Icons with light and dark versions follow the embedding page's color scheme by default. Both SVG endpoints accept \`theme=auto|light|dark\` (default auto) for an explicit override.

## Effects

Both SVG endpoints accept \`effect=none|glint|chrome|holo\`, \`intensity=0..100\`, \`effectDuration=1..20\` seconds, \`effectInterval=0..30\` seconds and \`effectVariation=0..100\` percent. Defaults are none, 35, 5, 3 and 55. Use \`effectArea=surface|border\`, \`effectTiming=stagger|random|sync\` and \`effectCoverage=all|some|selected\`. Selected coverage uses zero-based \`effectIndices=0,2\` into the loaded, deduplicated asset list. Marquees accept \`edgeFade=0..96\` px (default off). Effects are script-free; random timing repeats a seeded eight-sweep schedule with varied entry edges, directions and path offsets per asset, while repeated instances receive independent phases. Hover-to-pause and eased pause/resume are editor-only, and per-icon titles require inline SVG/HTML rather than README images. New composer exports include safe project metadata for re-import; API SVGs do not.

## Repository use and custom logos

Download an SVG and commit it beside the README: \`![My stack](./icon-marquee.svg)\`. No hosted API is needed for that file. URL embeds need a publicly reachable server.

The composer accepts local SVG, PNG, JPEG and WebP logos up to 2 MB each (20 per session). These are rasterized locally to embedded 256px PNGs; no files are uploaded. Uploads use the same rounded tile shape as the library. Auto detects simple monochrome artwork and generates adaptive light/dark colors; colored or ambiguous artwork keeps its pixels. Per-logo Original colors and Monochrome overrides are available. These settings survive project re-import. Download before reloading. Custom logos cannot be included in API or editor links.

## Examples

Markdown:
\`\`\`md
![icon-marquee](${origin}/v1/marquee?i=js,ts,react,docker)
\`\`\`

HTML, full-width banner:
\`\`\`html
<img src="${origin}/v1/marquee?i=go,rust,zig&width=1200" alt="icon-marquee" />
\`\`\`

Static row:
\`\`\`md
![icon-marquee](${origin}/v1/icons?i=html,css,js)
\`\`\`

## Usage notes for LLMs

- Only use names from the lists below. Unknown names are silently dropped from the image, so check the \`X-Unknown-Icons\` header when you verify a URL.
- Prefer short names where they exist (e.g. \`js\`, \`ts\`, \`py\`, \`k8s\`).
- Commas in \`i\` work literal or encoded. A literal \`+\` becomes a space, so encode it: \`notepad%2B%2B\`.

## Short names

${aliasLines}

## All icon names (${iconNames.length})

${iconNames.join(", ")}
`;
}
