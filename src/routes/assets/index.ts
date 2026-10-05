import { Hono } from "hono";
import { config } from "../../config";
import { loadIcons } from "../../utils/load";

export const assetsRoutes = new Hono();

assetsRoutes.get("/", async (c) => {
  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) return c.json({ error: result.error }, 400);
  c.header("Cache-Control", `public, max-age=${config.icons.cacheMaxAgeS}`);
  return c.json(result);
});
