import { config } from "../config";
import { scopeIds } from "./scope-ids";
import { createSvgRenderer } from "./svg";

export const rendererSettings = {
  sizeUnits: config.icons.sizeUnits,
  heightPx: config.icons.heightPx,
  gapUnits: config.icons.gapUnits,
  defaultWidthPx: config.marquee.defaultWidthPx,
  speedPxPerS: config.marquee.speedPxPerS,
  shufflePasses: config.marquee.shufflePasses,
  defaultSeed: config.marquee.defaultSeed,
};

const renderer = createSvgRenderer(rendererSettings, scopeIds);

export const renderIconRow = renderer.icons;
export const renderIconMarquee = renderer.marquee;
export type { IconRowOptions, MarqueeOptions } from "./svg";
