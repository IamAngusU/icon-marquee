# Icon Marquee

A visual composer for animated tech-stack SVGs. Search 1,041 icons, arrange your lineup, tune the motion, and export a self-contained SVG or an embed snippet.

Built on [gian-gg/icon-marquee](https://github.com/gian-gg/icon-marquee), with the upstream MIT license and icon attribution preserved. This repository is a private derivative, not an official upstream release.

## What's improved

- Responsive composer with live light/dark previews.
- Search by full name or alias, plus Frontend, Backend, Creative and AI presets.
- Reorder by dragging or focusing an icon and pressing **Alt + Left/Right**.
- Adjust canvas width, icon size, spacing, speed and direction.
- Pause the preview without changing the exported animation.
- Copy Markdown, escaped HTML, direct URLs or a link to the editor with all settings.
- Download a standalone SVG, including a static-row option.
- Cancel obsolete preview requests and disable exports when input is invalid.
- Unique SVG IDs across repeated rows; cached icon reads.
- Validated API controls, an icon catalog endpoint, TypeScript checks and CI.

## Run locally

Requires [Bun](https://bun.sh) 1.4.2 or newer.

```sh
bun install --frozen-lockfile
bun dev
```

Open [localhost:3000](http://localhost:3000). No environment setup is required. `APP_NAME` is optional and defaults to `icon-marquee`; `PORT` can be set for a different local port.

Production start: `bun start`. The page is server-rendered HTML/CSS with a small client script, so there is no frontend build step.

## Export and hosting

**SVG downloads are self-contained:** commit the file alongside your README and embed it:

```md
![My tech stack](./icon-marquee.svg)
```

**Live URL embeds need a running instance:** a private GitHub repository does not host this HTTP API. Localhost URLs work only on the machine running the server. Deploy the app to your own Bun host or Vercel, then copy snippets from that instance.

The included `vercel.json` selects Bun for Vercel's Hono preset. An externally reachable SVG endpoint is required for GitHub's image proxy to fetch live embeds; keeping the source repository private does not make a deployed endpoint private.

Icons adapt to the viewer's color scheme. The light/dark switch in the editor changes the preview background; it does not force a theme in the exported SVG.

## API

| Endpoint | Result |
| --- | --- |
| `GET /v1/marquee?i=js,ts,react` | Animated SVG |
| `GET /v1/icons?i=js,ts,react` | Static SVG |
| `GET /v1/catalog` | JSON containing canonical `names` and `aliases` |
| `GET /v1` | Health check |
| `GET /llms.txt` | Full API guide generated from the current icon registry |

All previous valid icon names and aliases remain supported. Existing URLs retain their default height, gap, width, speed and leftward motion.

| Parameter | Applies to | Values and default |
| --- | --- | --- |
| `i` | Both SVG endpoints | Required comma-separated names; maximum 100 |
| `height` | Both | Integer 20–128 px; default 48 |
| `gap` | Both | Integer 0–96 px; omitted = height × 44/256 |
| `width` | Marquee | Integer 1–3840 px; default min(400, one row) |
| `speed` | Marquee | Integer 5–200 px/s; default 30 |
| `direction` | Marquee | `left` (default) or `right` |

Numeric options use decimal digits only. The editor offers a width slider from 80 to 1600 px; the API supports the full range above.

```text
/v1/marquee?i=ts,react,nextjs,docker&width=800&height=64&gap=16&speed=40&direction=right
```

Order and duplicates are preserved. Case and surrounding whitespace in icon names are ignored. Unknown icons are skipped and reported in the URL-encoded `X-Unknown-Icons` header. Missing icons, more than 100 names, no recognized names or invalid supported options return HTTP 400 with a JSON error.

Animations honor `prefers-reduced-motion`. SVGs use CSS animation and do not require JavaScript when embedded as images. Actual animation support depends on the client displaying the image.

## Checks

```sh
bun run typecheck
bun run check
bun test
```

`check` applies Biome fixes. CI uses the non-mutating `bunx biome check .`.

The route tests cover defaults, aliases, unknown icons, traversal rejection, control bounds, loop geometry, repeated ID isolation, catalog consistency and the page's hashed Content Security Policy.

For UI verification: select a preset, search an alias, reorder an icon using the keyboard, change the controls, toggle static output, copy each snippet, download an SVG and reload a copied editor link. Check an empty list, unknown names and a narrow viewport.

See [architecture](docs/architecture.md) and [conventions](docs/conventions.md) for development details.

## Credits

Original service by [gian-gg](https://github.com/gian-gg/icon-marquee). Icons from [syvixor/skills-icons](https://github.com/syvixor/skills-icons). Full notices are in [ATTRIBUTION.md](ATTRIBUTION.md), [LICENSE](LICENSE) and [public/icons/LICENSE](public/icons/LICENSE).
