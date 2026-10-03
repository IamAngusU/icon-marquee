import { config } from "../config";
import { scopeIds } from "./scope-ids";

const { sizeUnits, gapUnits, heightPx } = config.icons;
const stride = sizeUnits + gapUnits;

const toPx = (units: number): number => (units * heightPx) / sizeUnits;
const toUnits = (px: number): number => (px * sizeUnits) / heightPx;

function rowMarkup(svgs: readonly string[], offset = 0): string {
  return svgs
    .map(
      (svg, index) =>
        `<g transform="translate(${offset + index * stride}, 0)">${scopeIds(svg, `i${index}`)}</g>`,
    )
    .join("");
}

function svgDocument(widthUnits: number, content: string): string {
  return `<svg width="${Math.round(toPx(widthUnits))}" height="${heightPx}" viewBox="0 0 ${widthUnits} ${sizeUnits}" fill="none" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
}

export function renderIconRow(svgs: readonly string[]): string {
  return svgDocument(svgs.length * stride - gapUnits, rowMarkup(svgs));
}

export function renderIconMarquee(svgs: readonly string[]): string {
  const period = svgs.length * stride;
  const width = Math.min(toUnits(config.marquee.maxWidthPx), period - gapUnits);
  const duration = (toPx(period) / config.marquee.speedPxPerS).toFixed(2);
  const style = `<style>@keyframes scroll{to{transform:translateX(-${period}px)}}.track{animation:scroll ${duration}s linear infinite}@media (prefers-reduced-motion:reduce){.track{animation:none}}</style>`;
  const track = `<g class="track">${rowMarkup(svgs)}${rowMarkup(svgs, period)}</g>`;

  return svgDocument(width, style + track);
}
