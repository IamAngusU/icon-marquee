import { Hono } from "hono";
import { config } from "../../config";
import { loadIcons } from "../../utils/load";
import { renderIconMarquee } from "../../utils/render";

const { maxWidthPx } = config.marquee;

export const marqueeRoutes = new Hono();

marqueeRoutes.get("/", async (c) => {
  const widthParam = c.req.query("width");
  const widthPx = widthParam === undefined ? undefined : Number(widthParam);
  if (
    widthPx !== undefined &&
    !(Number.isInteger(widthPx) && widthPx >= 1 && widthPx <= maxWidthPx)
  ) {
    return c.json(
      {
        error: `Query param 'width' must be a whole number from 1 to ${maxWidthPx}`,
      },
      400,
    );
  }

  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", `public, max-age=${config.icons.cacheMaxAgeS}`);
  return c.body(renderIconMarquee(result.svgs, widthPx));
});
