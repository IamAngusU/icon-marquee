import { config } from "../config";
import { scopeIds } from "./scope-ids";

const { sizeUnits } = config.icons;

export type IconRowOptions = {
  gapPx?: number;
  heightPx?: number;
};

export type MarqueeOptions = IconRowOptions & {
  direction?: "left" | "right";
  speedPxPerS?: number;
  widthPx?: number;
};

type Layout = {
  heightPx: number;
  stride: number;
};

function getLayout(options: IconRowOptions): Layout {
  const heightPx = options.heightPx ?? config.icons.heightPx;
  const gapUnits =
    options.gapPx === undefined
      ? config.icons.gapUnits
      : (options.gapPx * sizeUnits) / heightPx;

  return { heightPx, stride: sizeUnits + gapUnits };
}

const toPx = (units: number, heightPx: number): number =>
  (units * heightPx) / sizeUnits;

const toUnits = (px: number, heightPx: number): number =>
  (px * sizeUnits) / heightPx;

function rowMarkup(
  svgs: readonly string[],
  stride: number,
  offset = 0,
  copy = 0,
): string {
  return svgs
    .map(
      (svg, index) =>
        `<g transform="translate(${offset + index * stride}, 0)">${scopeIds(svg, `c${copy}-i${index}`)}</g>`,
    )
    .join("");
}

function svgDocument(
  widthUnits: number,
  heightPx: number,
  content: string,
): string {
  return `<svg width="${Math.round(toPx(widthUnits, heightPx))}" height="${heightPx}" viewBox="0 0 ${widthUnits} ${sizeUnits}" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function renderIconRow(
  svgs: readonly string[],
  options: IconRowOptions = {},
): string {
  const { heightPx, stride } = getLayout(options);
  const gapUnits = stride - sizeUnits;
  return svgDocument(
    svgs.length * stride - gapUnits,
    heightPx,
    rowMarkup(svgs, stride),
  );
}

export function renderIconMarquee(
  svgs: readonly string[],
  options: MarqueeOptions = {},
): string {
  const { heightPx, stride } = getLayout(options);
  const period = svgs.length * stride;
  const gapUnits = stride - sizeUnits;
  const width =
    options.widthPx === undefined
      ? Math.min(
          toUnits(config.marquee.defaultWidthPx, heightPx),
          period - gapUnits,
        )
      : toUnits(options.widthPx, heightPx);
  const copies = Math.ceil(width / period) + 1;
  const speed = options.speedPxPerS ?? config.marquee.speedPxPerS;
  const duration = (toPx(period, heightPx) / speed).toFixed(2);
  const keyframes =
    options.direction === "right"
      ? `from{transform:translateX(-${period}px)}`
      : `to{transform:translateX(-${period}px)}`;
  const style = `<style>@keyframes scroll{${keyframes}}.track{animation:scroll ${duration}s linear infinite}@media (prefers-reduced-motion:reduce){.track{animation:none}}</style>`;
  const rows = Array.from({ length: copies }, (_, copy) =>
    rowMarkup(svgs, stride, copy * period, copy),
  ).join("");

  return svgDocument(width, heightPx, `${style}<g class="track">${rows}</g>`);
}
