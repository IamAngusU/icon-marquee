import { Hono } from "hono";
import { config } from "../../config";
import { loadIcons } from "../../utils/load";
import { renderIconMarquee } from "../../utils/render";

export const marqueeRoutes = new Hono();

marqueeRoutes.get("/", async (c) => {
  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", `public, max-age=${config.icons.cacheMaxAgeS}`);
  return c.body(renderIconMarquee(result.svgs));
});
