# Usage

## Composer

Pick a preset or search for icons by name or alias. Drag the selected icons to reorder them; keyboard users can focus an icon and press Alt+Left/Right. Set size, gap, width, speed and direction, or switch to a static row.

Pause freezes the current position and queue. Resume continues from there. Changing composition or geometry intentionally starts a new preview. Light/dark switching does not reset motion. The preview also suspends while the tab is hidden or reduced motion is enabled.

Repeat preserves your order. Shuffle draws fresh shuffled bags: every selected slot appears once per bag, avoiding identical slot indices across bag boundaries. Duplicate selected logos still count as separate slots. The live preview replenishes continuously; an exported SVG uses 16 deterministic shuffled rounds before repeating. With only two distinct icons, avoiding adjacent duplicates naturally alternates them.

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

## Run and deploy

`bun dev` runs with hot reload; `bun start` runs production. `PORT` defaults to 3000. Optional `APP_NAME` defaults to `icon-marquee`. The server uses Bun/Hono; there is no frontend build step.

Deploy to a Bun-compatible host, or use Vercel's Hono preset with the included Bun configuration. No authentication is built in. Source visibility and endpoint access are independent: a private source repo does not protect a deployed API.

## Checks

```sh
bun run typecheck
bun run check
bun test
```

`check` applies Biome fixes. CI uses read-only `bunx biome check .`. For UI checks, test pause/resume, both directions, shuffle, uploads and errors, static output, snippets/downloads, editor links, keyboard reordering and a narrow viewport. Regenerate the README illustrations with `bun run readme:assets` after changing the renderer.
