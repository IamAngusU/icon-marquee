# Usage

## Composer

Pick a preset or search for icons by name or alias. Drag the selected icons to reorder them; keyboard users can focus an icon and press Alt+Left/Right. Set size, gap, width, speed and direction, or switch to a static row.

Instant pause freezes the current position and queue. Resume continues from there. Optional easing changes velocity smoothly before stopping, then accelerates from the stopped position. Changing composition or geometry intentionally starts a new preview. Light/dark switching does not reset motion. The preview also suspends while the tab is hidden or reduced motion is enabled.

Repeat preserves your order, including deliberate duplicates. Shuffle deduplicates identical SVG sources (including aliases), excludes the last half of the unique lineup, and favors the least-used eligible logos. This prevents direct repeats and short A–B–A patterns when there are enough logos, while keeping the distribution balanced. Both directions use the same picker. A live preview replenishes continuously; exports use a seeded sequence of 16 × unique icon count, with the same repeat spacing across the loop seam. With only two distinct icons, avoiding repeats necessarily alternates them. A wide canvas containing more slots than unique logos will still show duplicates at a distance.

## Effects and motion presets

Open **Effects & behavior** for Original, Glint or Chrome finishes, Instant/Ease/Custom Bézier pause behavior, and optional hover-to-pause. Default settings stay plain and immediate. Glint and Chrome are included in the downloaded SVG. Hover and pause controls require the interactive generator: GitHub displays a passive image and cannot run a generator or receive its internal hover events.

The YAML panel supports a small, validated subset: flat scalar keys and a four-number flow sequence. Unknown keys, duplicate keys, code, aliases and out-of-range values are rejected. This is a preset format, not a CSS/shader programming language.

```yaml
effect: glint
intensity: 35
effectDuration: 5
pauseStyle: bezier
pauseDuration: 450
bezier: [0.42, 0, 0.58, 1]
hoverPause: true
```

Intensity is 0–100%, effectDuration is 1–20 seconds, pauseDuration is 100–2000 milliseconds, and Bézier coordinates stay between 0 and 1 to avoid reversing the motion. Partial presets start from the defaults. Copy YAML to share settings; copied editor links include the applied preset. Custom logos are still local-only. Reduced-motion preferences override animation.

## Put it in a repository

Download `icon-marquee.svg` (or `icon-row.svg` for static output), commit it beside your README and use the generated Markdown:

```md
![My tech stack](./icon-marquee.svg)
```

Markdown and HTML snippets point to this downloaded file. The URL tab instead copies a live API URL. Live embeds need an externally reachable running instance; localhost and making the source repository public do not host an API. GitHub's image proxy must be able to fetch the endpoint. SVG animation support depends on the client; reduced-motion viewers see a stationary row.

## Your own logos

Use **Your logos** to add SVG, PNG, JPEG or WebP files, up to 2 MB per file and 20 local logos per session. Logos appear in the library and can be combined with built-in icons.

Files never leave the browser. They are decoded in an isolated image context and rendered to transparent 256×256 PNGs, preserving aspect ratio. This removes active SVG markup and keeps the exported file self-contained. Custom SVGs are therefore not retained as editable vectors, and animation/external resources in uploaded SVGs are not supported. Built-in icons remain vector.

Download before refreshing: local logos live in memory, not browser storage. Editor sharing and live URL export are disabled while local logos are selected. They require the actual downloaded SVG. Uploaded logos do not automatically gain light/dark variants. Use only assets you have permission to use.

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

Both SVG endpoints also accept `effect=none|glint|chrome`, `intensity=0..100`, `effectDuration=1..20` and `theme=auto|light|dark`. Auto is the default; themed SVGs inherit the embedding page's color scheme in modern browsers. GitHub sets that scheme from its selected theme, so a single adaptive SVG covers light and dark. Logos without theme variants do not change. If targeting an older image client, `theme=light` or `theme=dark` can create explicit variants for a `<picture>` fallback.

## Run and deploy

Use the [public generator](https://icon-marquee.bloomy-yak-1739.chatgpt.site) without installing anything, or run locally with Bun 1.4.2+:

```sh
bun install --frozen-lockfile
bun dev
```

`bun dev` runs with hot reload; `bun start` runs production. `PORT` defaults to 3000. Optional `APP_NAME` defaults to `icon-marquee`. The server uses Bun/Hono; there is no frontend build step.

`bun run build:static` exports a portable, browser-only generator to `dist/`. It uses relative local icon assets and no API backend, so it can also live on GitHub Pages or another static host. The public generator uses Sites; its project identity is in `.openai/hosting.json`. Source remains mirrored in this GitHub repository. Publish edits through the Sites workflow and preserve the public audience; update the GitHub mirror after checks. API URL export is hidden in the static generator because static hosting does not run the optional HTTP API.

Deploy to a Bun-compatible host, or use Vercel's Hono preset with the included Bun configuration. No authentication is built in. Source visibility and endpoint access are independent: a private source repo does not protect a deployed API.

## Checks

```sh
bun run typecheck
bun run check
bun test
```

`check` applies Biome fixes. CI uses read-only `bunx biome check .`. For UI checks, test pause/resume, both directions, shuffle, uploads and errors, static output, snippets/downloads, editor links, keyboard reordering and a narrow viewport. Regenerate the README illustrations with `bun run readme:assets` after changing the renderer.
