import { Hono } from "hono";
import { loadIcons } from "../../utils/load";
import { renderIconRow } from "../../utils/render";
import { svgResponse } from "../../utils/respond";

export const iconsRoutes = new Hono();

iconsRoutes.get("/", async (c) => {
  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  return svgResponse(c, renderIconRow(result.svgs), result.unknown);
});
