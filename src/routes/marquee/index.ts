import { Hono } from "hono";
import { loadIcons } from "../../utils/load";
import { marqueeQuery } from "../../utils/marquee-query";
import { renderIconMarquee } from "../../utils/render";
import { svgResponse } from "../../utils/respond";

export const marqueeRoutes = new Hono();

marqueeRoutes.get("/", async (c) => {
  const options = marqueeQuery(c.req.query());
  if ("error" in options) return c.json({ error: options.error }, 400);

  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  return svgResponse(
    c,
    renderIconMarquee(result.svgs, options.value),
    result.unknown,
  );
});
