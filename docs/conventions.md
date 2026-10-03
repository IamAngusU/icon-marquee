# Conventions

See `docs/architecture.md` for the stack, layout and request flow.

## Routes

- Each route module lives in `src/routes/<name>/index.ts` and exports a `Hono` instance named `<name>Routes`.
- Register it in `src/routes/index.ts` with `routes.route("/<path>", <name>Routes)`.
- Do not expose internal details (app name, env values) in responses.

## Config and env

- Read env vars only in `src/config.ts`, through `requireEnv`, and import `config` everywhere else.
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

## Before finishing work

- Run `bun run typecheck` and `bun run check`.
- Start the server and hit the changed endpoints.
