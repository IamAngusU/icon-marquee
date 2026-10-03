import type { Context } from "hono";
import { config } from "../config";

export const UNKNOWN_ICONS_HEADER = "X-Unknown-Icons";

// SVG response that lists skipped names, URL-encoded, in a header.
export function svgResponse(
  c: Context,
  svg: string,
  unknown: readonly string[],
): Response {
  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", `public, max-age=${config.icons.cacheMaxAgeS}`);
  if (unknown.length > 0) {
    c.header(UNKNOWN_ICONS_HEADER, unknown.map(encodeURIComponent).join(","));
  }
  return c.body(svg);
}
