# Architecture

## Stack

- Runtime and package manager: Bun
- HTTP framework: Hono
- Language: TypeScript, strict mode
- Lint and format: Biome
- Git hooks: Husky

## Layout

```
src/
├── index.ts          # app entry: creates the app, mounts versioned routes
├── config.ts         # env-backed config
├── utils/
│   ├── load.ts       # parses the `i` query, validates and reads icon SVGs
│   ├── registry.ts   # indexes public/icons at startup, resolves names to files
│   ├── render.ts     # static row and animated marquee
│   └── scope-ids.ts  # prefixes each icon's ids so icons share one document
└── routes/
    ├── index.ts      # combines route modules
    └── <name>/
        └── index.ts  # one route module per folder

public/
└── icons/
    ├── LICENSE       # upstream MIT license
    └── <name>/
        ├── auto.svg  # follows prefers-color-scheme
        ├── dark.svg
        ├── light.svg
        └── default.svg  # only for icons without theme variants
```

## Icons

Icons come from [LelouchFR/skill-icons](https://github.com/LelouchFR/skill-icons) (MIT, commit `5401d69`). Upstream `assets/<name>-<variant>.svg` maps to `public/icons/<name>/<variant>.svg`, and an upstream file with no variant suffix becomes `default.svg`. An icon has either the three themed variants or a single `default.svg`.

`public/icons` is excluded from Biome.

## Endpoints

| Method | Path | Does |
| --- | --- | --- |
| GET | `/v1` | Health check |
| GET | `/v1/icons?i=js,html,css` | One SVG with the requested icons in a row, in request order |
| GET | `/v1/marquee?i=js,html,css` | Animated SVG scrolling the same row in a loop |

Both icon endpoints share `src/utils/load.ts`, so they take the same `i` param and return the same errors.

`/v1/icons` accepts icon folder names or short names from `config.icons.aliases`, up to `config.icons.maxPerRequest` (100) per request. It serves `auto.svg` when an icon has theme variants, otherwise `default.svg`. Rows are 48px tall, with icons 256 units wide and a 44-unit gap. Unknown names return 400 and list the bad names. Names resolve only through the startup index, so no request path reaches the filesystem directly.

`/v1/marquee` draws the row twice and slides it left by one row width (icon count × 300 units) with a looping CSS animation, so the loop is seamless. The window is at most `config.marquee.maxWidthPx` (400px) wide, or one row if the row is narrower. Speed is a constant `config.marquee.speedPxPerS` (30px/s), so the duration grows with the icon count. A `prefers-reduced-motion: reduce` rule stops the animation. CSS animations run inside `<img>`, so it works in READMEs.

Each icon's ids, and every reference to them, are prefixed with `i<index>-` when combined. Upstream icons reuse ids such as `Path`, `Vector` and `clip0_…`, which would otherwise clash. Some upstream icons reference ids they never define; those references stay unresolved, as they are when the icon is viewed alone.

## Request flow

1. `src/index.ts` creates the root `Hono` app and mounts `routes` at `/v1`. Bun serves its default export.
2. `src/routes/index.ts` mounts each route module at its path.
3. Each route module under `src/routes/<name>/` handles its own endpoints.

## Versioning

All endpoints live under `/v1`. A new API version is a separate route tree mounted at its own prefix in `src/index.ts`.

## Config

`src/config.ts` reads env vars once at startup through `requireEnv` and exports a single `config` object. The same object holds the tuning values: `icons` (max per request, short-name aliases, icon size, row height, gap, cache lifetime) and `marquee` (max window width, speed). `icons.sizeUnits` must match the icon files' 256×256 viewBox. Bun loads `.env` automatically. A missing required var stops the server from starting.

## Tooling

- Biome handles linting, formatting and import sorting, configured in `biome.json`.
- The Husky pre-commit hook runs `tsc --noEmit`, then `biome check --write` on staged files, and re-stages fixes.

## Deployment

Deployed on Vercel with the zero-config Hono preset, which picks up `src/index.ts`.

- `vercel.json` sets `bunVersion` so the function runs on Bun. The code uses `Bun.file`, so it does not run on Vercel's default Node runtime.
- `public/icons` reaches the function through Vercel's file tracing. The tracer follows `new URL("../../public/icons", import.meta.url)` in `src/utils/registry.ts`, but not `import.meta.dir`, so keep the `import.meta.url` form. `includeFiles` in `vercel.json` has no effect with the Hono preset.
- `tsconfig.json` sets `typeRoots`. Vercel transpiles through a temporary tsconfig in `/tmp` that extends ours, and without `typeRoots` it cannot find `types: ["bun"]`.
- `APP_NAME` must be set in the Vercel project's environment variables, or the function fails at startup.
- Check a build locally with `bunx vercel build`. It needs `.vercel/project.json`, which `vercel link` or `vercel pull` creates.
