import { Hono } from "hono";
import { config } from "../../config";
import { loadIcons } from "../../utils/load";
import { optionalWholeNumber } from "../../utils/query";
import { renderIconRow } from "../../utils/render";
import { svgResponse } from "../../utils/respond";

export const iconsRoutes = new Hono();

iconsRoutes.get("/", async (c) => {
  const height = optionalWholeNumber(
    "height",
    c.req.query("height"),
    config.icons.minHeightPx,
    config.icons.maxHeightPx,
  );
  if ("error" in height) {
    return c.json({ error: height.error }, 400);
  }

  const gap = optionalWholeNumber(
    "gap",
    c.req.query("gap"),
    config.icons.minGapPx,
    config.icons.maxGapPx,
  );
  if ("error" in gap) {
    return c.json({ error: gap.error }, 400);
  }

  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  return svgResponse(
    c,
    renderIconRow(result.svgs, { heightPx: height.value, gapPx: gap.value }),
    result.unknown,
  );
});
