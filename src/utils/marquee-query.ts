import { config } from "../config";
import { optionalWholeNumber } from "./query";
import type { MarqueeOptions } from "./render";
import { visualQuery } from "./visual-query";

export function marqueeQuery(
  query: Record<string, string>,
): { value: MarqueeOptions } | { error: string } {
  const visual = visualQuery(query);
  if ("error" in visual) return visual;

  const order = query.order;
  if (order !== undefined && order !== "repeat" && order !== "shuffle") {
    return { error: "Query param 'order' must be 'repeat' or 'shuffle'" };
  }
  const direction = query.direction;
  if (
    direction !== undefined &&
    direction !== "left" &&
    direction !== "right"
  ) {
    return { error: "Query param 'direction' must be 'left' or 'right'" };
  }

  const seed = optionalWholeNumber(
    "seed",
    query.seed,
    0,
    config.marquee.maxSeed,
  );
  if ("error" in seed) return seed;
  const numberParams = {
    widthPx: optionalWholeNumber(
      "width",
      query.width,
      1,
      config.marquee.maxWidthPx,
    ),
    heightPx: optionalWholeNumber(
      "height",
      query.height,
      config.icons.minHeightPx,
      config.icons.maxHeightPx,
    ),
    gapPx: optionalWholeNumber(
      "gap",
      query.gap,
      config.icons.minGapPx,
      config.icons.maxGapPx,
    ),
    speedPxPerS: optionalWholeNumber(
      "speed",
      query.speed,
      config.marquee.minSpeedPxPerS,
      config.marquee.maxSpeedPxPerS,
    ),
  };
  const invalidNumber = Object.values(numberParams).find(
    (param) => "error" in param,
  );
  if (invalidNumber && "error" in invalidNumber) return invalidNumber;

  return {
    value: {
      ...visual.value,
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
      order,
      seed: seed.value,
    },
  };
}
