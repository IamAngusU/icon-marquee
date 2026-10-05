# Architecture

## Stack and layout

Bun 1.4.2+, Hono, strict TypeScript, Biome and Husky. The app has no frontend framework or build pipeline.

```text
src/
  index.ts               Root Hono app
  config.ts              Environment defaults, aliases and limits
  landing/
    index.ts             HTML and SHA-256 hash of the client script
    styles.ts            Responsive composer styles
    script.ts            Typed, self-contained client function serialized for the browser
    preview.ts           Bounded live queue and position-preserving animation clock
    logos.ts             Local image decoding and rasterization
    logo.ts              Existing SVG favicon
  llms/index.ts          API reference generated from config and registry
  utils/
    registry.ts          Startup icon index
    load.ts              Name validation and cached SVG reads
    query.ts             Shared whole-number option validation
    render.ts            Configured server renderer
    svg.ts               Shared browser/server SVG factory and seeded shuffle
    motion.ts            Shared cooldown picker and Bézier interpolation
    preset.ts            Bounded flat YAML preset codec
    visual-query.ts      API effect/theme validation
    scope-ids.ts         Icon ID/reference scoping
    respond.ts           SVG content type, caching and skipped-icon header
  routes/
    catalog/             JSON icon catalog
    assets/              Validated source SVGs for the browser renderer
    icons/               Static SVG endpoint
    marquee/             Animated SVG endpoint
    landing/             Page and favicon
    llms/                Text API guide
    root/                Health check
public/icons/            Upstream SVGs and license
```

## Icon source and loading

The 1,041 bundled icons come from [syvixor/skills-icons](https://github.com/syvixor/skills-icons), commit `1d5b57218dd49e8185ae6b8dc6ee191ac4dbcd18`, under MIT. Files are unmodified 256×256 SVGs; themed files contain scoped `prefers-color-scheme` rules.

The startup registry indexes only actual filenames. User input resolves through that map and never becomes a filesystem path directly. Aliases preserve earlier short names. `loadIcons` allows at most 100 names, preserves ordering and duplicates, skips unknown names, and rejects a request with no known names. File-read promises are cached by resolved path; failed reads are removed from the cache. Restart the process after changing an icon.

`public/icons` is excluded from Biome. Keep `new URL("../../public/icons", import.meta.url)` in the registry so deployment file tracers include the assets.

## Endpoints

| Path | Result |
| --- | --- |
| `/` | Composer |
| `/logo.svg` | Favicon |
| `/llms.txt` | Origin-aware API guide |
| `/v1` | Health JSON |
| `/v1/catalog` | Canonical names and aliases |
| `/v1/assets?i=...` | Aligned names/SVGs and unknown names |
| `/v1/icons?i=...` | Static SVG |
| `/v1/marquee?i=...` | Animated SVG |

Both SVG endpoints accept `height` and `gap`. Marquee additionally accepts `width`, `speed`, `direction`, `order` and `seed`. All numeric options accept decimal digits only and validate their bounds against config. Defaults retain upstream geometry: 48px icons, 44 viewBox units between icons, a maximum default 400px window, leftward motion at 30px/s.

SVG responses use `image/svg+xml` and cache for one day. Skipped names are URL-encoded in `X-Unknown-Icons`. Validation failures return 400 JSON.

## SVG geometry

The renderer normalizes dimensions to the source icons' 256-unit viewBox. Explicit gaps are converted from output pixels; omitted gaps scale with icon height. The static row excludes the trailing gap.

A marquee period equals icon count multiplied by the stride (icon plus gap). The row is repeated `ceil(window / period) + 1` times. Animation moves by exactly one period. Duration is rendered period width divided by requested pixels per second. Rightward motion runs from negative one period to zero. A reduced-motion media query disables animation.

Each selected icon is defined once with its own ID prefix (`i<index>`) and reused via SVG `use` elements. Definitions stay unique across duplicate selections without copying source paths for every repeated row. The inherited ID scoper handles normal SVG identifiers; the upstream `8th` icon has an escaped CSS selector and keeps its default colors when combined.

Shuffle first deduplicates identical sources. A shared picker excludes the most recent floor(unique count / 2) icons and randomly chooses among the least-used eligible icons. Export uses a seeded 32-bit generator and 16 × unique count picks, retrying boundedly to respect the same cooldown at the cyclic seam; a cyclic permutation is the bounded fallback. SVG images cannot execute JavaScript, so only the editor supports continuously fresh randomness. The renderer factory is shared by browser, API and README asset generation.

Glint and Chrome use reusable SVG gradient/clip definitions and overlays, not arbitrary source CSS. Glint uses a reduced-motion-aware CSS animation. SVG media rules remain automatic by default; a validated explicit theme can force them for compatibility exports.

## Composer

The page uses a blue-gray/white palette, a navy preview canvas, blue actions and Space Grotesk headings with system text. Fonts come from Google Fonts with local fallbacks.

The left panel contains selected icons, text input, presets and a progressively revealed catalog. Search includes aliases. Items support removal, drag reordering and Alt+Left/Right keyboard reordering. The right panel controls SVG output and exports.

The client function in `script.ts` is TypeScript and is serialized with `toString()` after Bun transpilation. It must stay self-contained: do not close over server-only variables or imports. Serializable icon data is passed as a function argument.

Changes immediately abort outstanding asset requests and invalidate exports, then debounce regeneration. A request generation counter also prevents stale responses from winning races. Original bundled SVGs are fetched once from `/v1/assets` and cached by name. The shared renderer generates the download locally. Invalid/empty input hides the preview and disables copy/download.

The preview imports the generated SVG, disables its track CSS animation, and uses a bounded queue of `use` elements with a requestAnimationFrame clock. Offscreen items are recycled in order or replenished by the shared cooldown picker. The initial rightward queue is reversed so replenishment continues from the correct edge. Instant pause cancels the clock without replacing the DOM, queue or offset. Optional easing interpolates velocity with a bounded cubic Bézier and trapezoidal integration; retargeting preserves velocity and position. Hover and explicit pause are independent (manual pause takes precedence). Glint suspends via an inherited CSS variable when stopped. Reduced motion and hidden tabs suspend the clock too. Theme switching preserves track position.

Advanced options stay in one collapsed panel. The self-contained preset codec accepts only the documented flat YAML subset, with a 4 KB input limit and no scripts, custom tags, aliases or arbitrary CSS. Applied effects and motion settings are serialized into editor links.

Uploaded SVG/PNG/JPEG/WebP files are decoded in an isolated image context and rasterized to 256px transparent PNGs (2 MB/file, 20 per session, bounded dimensions and load timeout). Raw uploaded markup never enters the DOM. Embedded data URLs keep custom exports self-contained. Files stay in a memory map until reload, with no server upload or persistent browser storage. Editor-link and URL export are disabled when selected logos require local data.

Markdown and HTML snippets use the downloaded SVG filename; URL export uses the API. HTML attributes are escaped. Clipboard failures select the requested text for manual copying.

Configuration is stored in the URL fragment and restored on load. Internal section navigation preserves it. Copying an editor link includes the active settings; these URLs are origin-specific. No account, database, analytics or local-storage persistence is used.

## Security headers

The page uses a startup-computed SHA-256 CSP hash to authorize its inline client script. Inline CSS and Google Fonts are allowed; images allow same-origin, data and Blob URLs. Connections are same-origin only. Objects, framing and base URL changes are blocked.

Icon names and uploaded filenames enter the DOM through `textContent`, never HTML insertion. The catalog is bundled local metadata. API rendering uses server-side validated options and registry-selected SVG files. The inline preview uses only those trusted bundled assets or locally rasterized pixels. Do not add arbitrary SVG markup or remote source URLs to the preview renderer.

## Runtime and deployment

Bun automatically serves the default Hono export in `src/index.ts`. `bun dev` enables hot reload; `bun start` is the production entry point. `APP_NAME` is optional and defaults in config; Bun handles its standard `PORT` environment variable.

Vercel's Hono preset uses the existing `vercel.json` Bun version setting. `Bun.file` requires Bun, not the default Node runtime. Keep explicit `typeRoots` in tsconfig for Vercel's temporary configuration.

Repository privacy and endpoint access are separate. There is no authentication layer. Deploy only when a public SVG endpoint is wanted, or protect a private instance at the hosting layer. GitHub's image proxy needs a reachable image URL; alternatively commit a downloaded SVG with the consuming README.

The public generator is a separate static build of the same composer. `scripts/build-static.ts` writes HTML with its own hashed script CSP, the local SVG catalog, favicon and licenses to `dist/`. Relative icon paths work on subpath hosting. The browser uses those assets instead of `/v1/assets`, and hides API URL export. Sites publishes `dist/` according to `.openai/hosting.json`; its source push does not replace the GitHub origin. Keep generated output out of Git, build before publishing, and push the verified source commit to GitHub as well. No user logo data is uploaded to either service.

## Validation

Route tests use Hono's in-memory request method without a server. CI runs frozen dependency installation, TypeScript, a read-only Biome check and Bun tests. Before completing rendering or UI changes, also start the service, request changed endpoints and exercise the composer in a browser.
