# Conventions

See `docs/architecture.md` for the stack, layout and request flow.

## Routes

- Each route module lives in `src/routes/<name>/index.ts` and exports a `Hono` instance named `<name>Routes`.
- Register it in `src/routes/index.ts` with `routes.route("/<path>", <name>Routes)`.
- Do not expose internal details (app name, env values) in responses.
- Tests sit next to the route as `index.test.ts` and call the module with `routes.request()`, without starting a server.

## Config and env

- Read env vars only in `src/config.ts`, through `requireEnv`, and import `config` everywhere else.
- Tuning values (limits, sizes, speeds, cache lifetimes) live in `config`, not as constants in modules.
- Add every new var to both `.env` (gitignored) and `.env.example` (committed, values empty).
- Do not add dotenv; Bun loads `.env`.

## Code style

- Biome enforces formatting: 2-space indent, double quotes.
- Named exports; no default exports except the app in `src/index.ts`.
- Comments say what, in one line. Most code needs none. No rationale, history or tradeoff essays in comments; those go in `docs/`.

## Scripts

| Script | Does |
| --- | --- |
| `bun dev` | Run with hot reload |
| `bun start` | Run |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | Biome lint |
| `bun run format` | Biome format with writes |
| `bun run check` | Biome lint, format and import sorting with writes |
| `bun test` | Run tests |

## Before finishing work

- Run `bun run typecheck`, `bun run check` and `bun test`.
- Start the server and hit the changed endpoints.
