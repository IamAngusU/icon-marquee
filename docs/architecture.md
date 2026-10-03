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
├── icons/
│   ├── aliases.ts    # short names (js, ts, wasm…) to icon folder names
│   ├── registry.ts   # indexes public/icons at startup, resolves names to files
│   └── render.ts     # lays out icon SVGs in one row
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

`/v1/icons` accepts icon folder names or short names from `src/icons/aliases.ts`, up to 100 per request. It serves `auto.svg` when an icon has theme variants, otherwise `default.svg`. Rows are 48px tall, with icons 256 units wide and a 44-unit gap. Unknown names return 400 and list the bad names. Names resolve only through the startup index, so no request path reaches the filesystem directly.

## Request flow

1. `src/index.ts` creates the root `Hono` app and mounts `routes` at `/v1`. Bun serves its default export.
2. `src/routes/index.ts` mounts each route module at its path.
3. Each route module under `src/routes/<name>/` handles its own endpoints.

## Versioning

All endpoints live under `/v1`. A new API version is a separate route tree mounted at its own prefix in `src/index.ts`.

## Config

`src/config.ts` reads env vars once at startup through `requireEnv` and exports a single `config` object. Bun loads `.env` automatically. A missing required var stops the server from starting.

## Tooling

- Biome handles linting, formatting and import sorting, configured in `biome.json`.
- The Husky pre-commit hook runs `tsc --noEmit`, then `biome check --write` on staged files, and re-stages fixes.
