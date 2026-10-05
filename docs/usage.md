# Usage

## Composer

Pick a preset or search for icons by name or alias. Drag the selected icons to reorder them; keyboard users can focus an icon and press Alt+Left/Right. Set size, gap, width, speed and direction, or switch to a static row.

Instant pause freezes the current position and queue. Resume continues from there. Optional easing changes velocity smoothly before stopping, then accelerates from the stopped position. Changing composition or geometry intentionally starts a new preview. Light/dark switching does not reset motion. The preview also suspends while the tab is hidden or reduced motion is enabled.

Repeat preserves your order, including deliberate duplicates. Shuffle deduplicates identical SVG sources (including aliases), excludes the last half of the unique lineup, and favors the least-used eligible logos. This prevents direct repeats and short A–B–A patterns when there are enough logos, while keeping the distribution balanced. Both directions use the same picker. A live preview replenishes continuously; exports use a seeded sequence of 16 × unique icon count, with the same repeat spacing across the loop seam. With only two distinct icons, avoiding repeats necessarily alternates them. A wide canvas containing more slots than unique logos will still show duplicates at a distance.

## Effects and motion presets

Open **Effects & behavior** for Glint, Chrome or Holo, on the whole icon or only its rounded border. Original leaves the logos unchanged. Ghost edges softly fade incoming/outgoing icons (0 turns the fade off). Finish timing can be staggered, together, or random with varying sweep durations and rests. Choose all icons, occasional accents, or names from your lineup. These effects work in exported SVGs without JavaScript. Random exports repeat a seeded eight-sweep schedule per asset; repeated copies of the same logo share that schedule. Occasional accents are probabilistic, not a guarantee that exactly one icon shines at a time.

Optional icon-name tooltips work in the editor (hover or keyboard focus, Escape to dismiss) and as native titles in inline HTML. GitHub embeds a passive image and does not expose per-icon tooltips. Instant/Ease/Custom Bézier pause and hover-to-pause are editor controls; exported images keep looping. The editor pauses both scroll and finishes at the current position.

The YAML panel supports a small, validated subset: flat scalar keys and a four-number flow sequence. Unknown keys, duplicate keys, code, aliases and out-of-range values are rejected. This is a preset format, not a CSS/shader programming language.

```yaml
effect: glint
intensity: 35
effectArea: border
effectTiming: random
effectCoverage: selected
effectIcons: "js, react"
effectDuration: 5
effectInterval: 3
effectVariation: 55
edgeFade: 24
tooltips: true
pauseStyle: bezier
pauseDuration: 450
bezier: [0.42, 0, 0.58, 1]
hoverPause: true
```

Intensity and random speed variation are 0–100%, sweep duration is 1–20 seconds, sweep interval is 0–30 seconds, edge fade is 0–96px, pause duration is 100–2000 milliseconds, and Bézier coordinates stay between 0 and 1. Partial presets start from defaults. Copy YAML or an editor link to share settings. Custom logos require the actual export. Reduced-motion preferences override animation.

## Put it in a repository

Download `icon-marquee.svg` (or `icon-row.svg` for static output), commit it beside your README and use the generated Markdown:

```md
![My tech stack](./icon-marquee.svg)
```

Markdown points to this downloaded file. HTML copies inline SVG (including its editable metadata); **Download HTML** saves a standalone page. The URL tab instead copies a live API URL. Live embeds need an externally reachable running instance; localhost and making the source repository public do not host an API. GitHub's image proxy must be able to fetch the endpoint. SVG animation support depends on the client; reduced-motion viewers see a stationary row.

## Reopen a design

Under **Open an existing design**, choose or drop an Icon Marquee SVG/HTML export, or paste its contents. Import replaces the current design. New composer exports retain icons, uploaded PNG pixels, geometry, seed, effect and pause settings in versioned metadata. Everything is validated and processed locally; imported HTML/SVG code is never executed. Maximum file size is 12 MB.

Older exports, API SVGs and third-party artwork lack these settings. They cannot be decomposed into an editable marquee; add them through **Your logos** instead. Export optimizers that remove metadata also remove the ability to reopen the design.

## Your own logos

Use **Your logos** to add SVG, PNG, JPEG or WebP files, up to 2 MB per file and 20 local logos per session. Logos appear in the library and can be combined with built-in icons.

Files never leave the browser. They are decoded in an isolated image context and rendered to transparent 256×256 PNGs, preserving aspect ratio. This removes active SVG markup and keeps the exported file self-contained. Custom SVGs are therefore not retained as editable vectors, and animation/external resources in uploaded SVGs are not supported. Built-in icons remain vector.

All uploads get the same rounded tile shape as the built-in icons. **Your logo colors** offers a per-logo choice:

- **Auto** detects simple black/white or near-neutral logos, including transparent marks and solid light/dark backgrounds. These switch between a light mark on a dark tile and a dark mark on a light tile. Colored or ambiguous artwork keeps its original pixels.
- **Original colors** keeps the source colors, with matching rounded corners.
- **Monochrome** explicitly uses the derived shape mask. Best for simple transparent artwork; not a photo recoloring tool.

Detection is conservative, not semantic image recognition. Use Original colors if the automatic result changes intended details. Adaptive colors work in the preview and the self-contained exported SVG, with no second download. Theme choice and original pixels survive SVG/HTML re-import; older project exports default to Auto.

Download before refreshing: local logos live in memory, not browser storage. Editor sharing and live URL export are disabled while local logos are selected. They require the actual downloaded SVG. Use only assets you have permission to use.

## HTTP API

| Endpoint | Result |
| --- | --- |
| `GET /v1/marquee?i=js,ts,react` | Animated SVG |
| `GET /v1/icons?i=js,ts,react` | Static SVG |
| `GET /v1/assets?i=js,ts,react` | Original SVG strings, aligned names and unknown names |
| `GET /v1/catalog` | Canonical names and aliases |
| `GET /v1` | Health check |
| `GET /llms.txt` | Full, current API reference |

| Parameter | Applies to | Values and default |
| --- | --- | --- |
| `i` | SVGs and assets | Required comma-separated names; maximum 100 |
| `height` | Both SVGs | Integer 20–128 px; default 48 |
| `gap` | Both SVGs | Integer 0–96 px; omitted = height × 44/256 |
| `width` | Marquee | Integer 1–3840 px; default min(400, one row) |
| `speed` | Marquee | Integer 5–200 px/s; default 30 |
| `direction` | Marquee | `left` (default) or `right` |
| `order` | Marquee | `repeat` (default) or `shuffle` |
| `seed` | Marquee | Integer 0–4294967295; default 1; controls exported shuffle |

```text
/v1/marquee?i=ts,react,nextjs,docker&width=800&height=64&gap=16&speed=40&order=shuffle&seed=42
```

All numeric options require decimal digits. Order and duplicates are preserved by default. Case and surrounding whitespace are ignored. Unknown icons are skipped and reported in the URL-encoded `X-Unknown-Icons` header of SVG responses. Missing input, more than 100 names, no recognized names or invalid controls return 400 JSON. Assets expose skipped names in their `unknown` array.

SVGs use CSS animation and no JavaScript. Built-in themed icons follow the viewer's color scheme. The editor surface switch only changes the preview, not the downloaded asset. Responses cache for one day.

Both SVG endpoints also accept `effect=none|glint|chrome|holo`, `intensity=0..100`, `effectDuration=1..20`, `effectInterval=0..30`, `effectVariation=0..100`, `effectArea=surface|border`, `effectTiming=stagger|random|sync`, `effectCoverage=all|some|selected`, and comma-separated, zero-based `effectIndices=0,2` for selected mode. Indices refer to loaded assets after shuffle deduplication. `edgeFade=0..96` applies only to marquee. API fade defaults to off; the editor defaults to 24px.

Both endpoints accept `theme=auto|light|dark`. Auto is the default; themed SVGs inherit the embedding page's color scheme in modern browsers. GitHub sets that scheme from its selected theme, so a single adaptive SVG covers light and dark. Logos without theme variants do not change. If targeting an older image client, `theme=light` or `theme=dark` can create explicit variants for a `<picture>` fallback.

## Run and deploy

Use the [public generator](https://icon-marquee.angus509938.chatgpt.site) without installing anything, or run locally with Bun 1.4.2+:

```sh
bun install --frozen-lockfile
bun dev
```

`bun dev` runs with hot reload; `bun start` runs production. `PORT` defaults to 3000. Optional `APP_NAME` defaults to `icon-marquee`. The server uses Bun/Hono; there is no frontend build step.

`bun run build:static` exports a portable, browser-only generator to `dist/`. It uses relative local icon assets and no API backend, so it can also live on GitHub Pages or another static host. API URL export is hidden because static hosting does not run the optional HTTP API. The existing public Site is a legacy deployment, not the latest build. Moving to the owner's VPS under angusu.de is pending approval; do not republish to ChatGPT Sites. Use the local build for the latest features until that migration is complete.

Deploy to a Bun-compatible host, or use Vercel's Hono preset with the included Bun configuration. No authentication is built in. Source visibility and endpoint access are independent: a private source repo does not protect a deployed API.

## Checks

```sh
bun run typecheck
bun run check
bun test
```

`check` applies Biome fixes. CI uses read-only `bunx biome check .`. For UI checks, test pause/resume, both directions, shuffle, uploads and errors, static output, snippets/downloads, editor links, keyboard reordering and a narrow viewport. Regenerate the README illustrations with `bun run readme:assets` after changing the renderer.
