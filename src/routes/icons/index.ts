import { Hono } from "hono";
import { config } from "../../config";
import { loadIcons } from "../../utils/load";
import { optionalWholeNumber } from "../../utils/query";
import { renderIconRow } from "../../utils/render";
import { svgResponse } from "../../utils/respond";
import { visualQuery } from "../../utils/visual-query";

export const iconsRoutes = new Hono();

iconsRoutes.get("/", async (c) => {
  const visual = visualQuery(c.req.query());
  if ("error" in visual) return c.json({ error: visual.error }, 400);
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
    renderIconRow(result.svgs, {
      ...visual.value,
      heightPx: height.value,
      gapPx: gap.value,
    }),
    result.unknown,
  );
});
