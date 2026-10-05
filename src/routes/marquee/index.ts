import { Hono } from "hono";
import { config } from "../../config";
import { loadIcons } from "../../utils/load";
import { optionalWholeNumber } from "../../utils/query";
import { renderIconMarquee } from "../../utils/render";
import { svgResponse } from "../../utils/respond";

export const marqueeRoutes = new Hono();

marqueeRoutes.get("/", async (c) => {
  const numberParams = {
    widthPx: optionalWholeNumber(
      "width",
      c.req.query("width"),
      1,
      config.marquee.maxWidthPx,
    ),
    heightPx: optionalWholeNumber(
      "height",
      c.req.query("height"),
      config.icons.minHeightPx,
      config.icons.maxHeightPx,
    ),
    gapPx: optionalWholeNumber(
      "gap",
      c.req.query("gap"),
      config.icons.minGapPx,
      config.icons.maxGapPx,
    ),
    speedPxPerS: optionalWholeNumber(
      "speed",
      c.req.query("speed"),
      config.marquee.minSpeedPxPerS,
      config.marquee.maxSpeedPxPerS,
    ),
  };
  const invalidNumber = Object.values(numberParams).find(
    (param) => "error" in param,
  );
  if (invalidNumber && "error" in invalidNumber) {
    return c.json({ error: invalidNumber.error }, 400);
  }

  const direction = c.req.query("direction");
  if (
    direction !== undefined &&
    direction !== "left" &&
    direction !== "right"
  ) {
    return c.json(
      { error: "Query param 'direction' must be 'left' or 'right'" },
      400,
    );
  }

  const result = await loadIcons(c.req.query("i"));
  if ("error" in result) {
    return c.json({ error: result.error }, 400);
  }

  return svgResponse(
    c,
    renderIconMarquee(result.svgs, {
      widthPx:
        "value" in numberParams.widthPx
          ? numberParams.widthPx.value
          : undefined,
      heightPx:
        "value" in numberParams.heightPx
          ? numberParams.heightPx.value
          : undefined,
      gapPx:
        "value" in numberParams.gapPx ? numberParams.gapPx.value : undefined,
      speedPxPerS:
        "value" in numberParams.speedPxPerS
          ? numberParams.speedPxPerS.value
          : undefined,
      direction,
    }),
    result.unknown,
  );
});
