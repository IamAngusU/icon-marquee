import { Hono } from "hono";
import { resolveIconPath } from "../../icons/registry";
import { renderIconRow } from "../../icons/render";

const MAX_ICONS = 100;

export const iconsRoutes = new Hono();

iconsRoutes.get("/", async (c) => {
  const names = (c.req.query("i") ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (names.length === 0) {
    return c.json(
      { error: "Query param 'i' is required, e.g. ?i=js,html,css" },
      400,
    );
  }
  if (names.length > MAX_ICONS) {
    return c.json({ error: `At most ${MAX_ICONS} icons per request` }, 400);
  }

  const unknown = names.filter((name) => !resolveIconPath(name));
  if (unknown.length > 0) {
    return c.json({ error: `Unknown icons: ${unknown.join(", ")}` }, 400);
  }

  const paths = names.flatMap((name) => resolveIconPath(name) ?? []);
  const svgs = await Promise.all(paths.map((path) => Bun.file(path).text()));

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", "public, max-age=86400");
  return c.body(renderIconRow(svgs));
});
