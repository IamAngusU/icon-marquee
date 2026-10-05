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
    logo.ts              Existing SVG favicon
  llms/index.ts          API reference generated from config and registry
  utils/
    registry.ts          Startup icon index
    load.ts              Name validation and cached SVG reads
    query.ts             Shared whole-number option validation
    render.ts            SVG geometry, row repetition and animation
    scope-ids.ts         Icon ID/reference scoping
    respond.ts           SVG content type, caching and skipped-icon header
  routes/
    catalog/             JSON icon catalog
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
| `/v1/icons?i=...` | Static SVG |
| `/v1/marquee?i=...` | Animated SVG |

Both SVG endpoints accept `height` and `gap`. Marquee additionally accepts `width`, `speed` and `direction`. All numeric options accept decimal digits only and validate their bounds against config. Defaults retain upstream geometry: 48px icons, 44 viewBox units between icons, a maximum default 400px window, leftward motion at 30px/s.

SVG responses use `image/svg+xml` and cache for one day. Skipped names are URL-encoded in `X-Unknown-Icons`. Validation failures return 400 JSON.

## SVG geometry

The renderer normalizes dimensions to the source icons' 256-unit viewBox. Explicit gaps are converted from output pixels; omitted gaps scale with icon height. The static row excludes the trailing gap.

A marquee period equals icon count multiplied by the stride (icon plus gap). The row is repeated `ceil(window / period) + 1` times. Animation moves by exactly one period. Duration is rendered period width divided by requested pixels per second. Rightward motion runs from negative one period to zero. A reduced-motion media query disables animation.

Every icon in every repeated copy gets its own ID prefix (`c<copy>-i<index>`). Definitions and references therefore stay unique across both duplicate icons and repeated rows. The inherited ID scoper handles normal SVG identifiers; the upstream `8th` icon has an escaped CSS selector and keeps its default colors when combined.

## Composer

The page uses a blue-gray/white palette, a navy preview canvas, blue actions and Space Grotesk headings with system text. Fonts come from Google Fonts with local fallbacks.

The left panel contains selected icons, text input, presets and a progressively revealed catalog. Search includes aliases. Items support removal, drag reordering and Alt+Left/Right keyboard reordering. The right panel controls SVG output and exports.

The client function in `script.ts` is TypeScript and is serialized with `toString()` after Bun transpilation. It must stay self-contained: do not close over server-only variables or imports. Serializable icon data is passed as a function argument.

Changes immediately abort outstanding preview requests and invalidate exports, then debounce regeneration. A request generation counter also prevents stale responses from winning races. Successful SVG text creates a Blob URL for the preview and is reused for download, avoiding a second SVG fetch. Previous Blob URLs are revoked. Invalid/empty input hides the image and disables copy/download.

Pause affects only the preview. Preview background controls the embedded image's color scheme, while downloaded images follow the viewer. HTML snippets escape ampersands and quotes. Clipboard failures select the requested text for manual copying.

Configuration is stored in the URL fragment and restored on load. Internal section navigation preserves it. Copying an editor link includes the active settings; these URLs are origin-specific. No account, database, analytics or local-storage persistence is used.

## Security headers

The page uses a startup-computed SHA-256 CSP hash to authorize its inline client script. Inline CSS and Google Fonts are allowed; images allow same-origin, data and Blob URLs. Connections are same-origin only. Objects, framing and base URL changes are blocked.

Icon names from text input enter the DOM through `textContent`, never HTML insertion. The catalog is bundled local metadata. Rendering uses only server-side validated numeric/enumerated options and registry-selected SVG files.

## Runtime and deployment

Bun automatically serves the default Hono export in `src/index.ts`. `bun dev` enables hot reload; `bun start` is the production entry point. `APP_NAME` is optional and defaults in config; Bun handles its standard `PORT` environment variable.

Vercel's Hono preset uses the existing `vercel.json` Bun version setting. `Bun.file` requires Bun, not the default Node runtime. Keep explicit `typeRoots` in tsconfig for Vercel's temporary configuration.

Repository privacy and endpoint access are separate. There is no authentication layer. Deploy only when a public SVG endpoint is wanted, or protect a private instance at the hosting layer. GitHub's image proxy needs a reachable image URL; alternatively commit a downloaded SVG with the consuming README.

## Validation

Route tests use Hono's in-memory request method without a server. CI runs frozen dependency installation, TypeScript, a read-only Biome check and Bun tests. Before completing rendering or UI changes, also start the service, request changed endpoints and exercise the composer in a browser.
