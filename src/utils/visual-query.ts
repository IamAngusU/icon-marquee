import type { IconRowOptions } from "./svg";

export function visualQuery(
  query: Record<string, string>,
): { value: IconRowOptions } | { error: string } {
  const value: IconRowOptions = {};
  if (query.effect !== undefined) {
    if (!["none", "glint", "chrome"].includes(query.effect))
      return { error: "effect must be none, glint or chrome" };
    value.effect = query.effect as IconRowOptions["effect"];
  }
  if (query.theme !== undefined) {
    if (!["auto", "light", "dark"].includes(query.theme))
      return { error: "theme must be auto, light or dark" };
    value.theme = query.theme as IconRowOptions["theme"];
  }
  for (const [key, min, max] of [
    ["intensity", 0, 100],
    ["effectDuration", 1, 20],
  ] as const) {
    const text = query[key];
    if (text === undefined) continue;
    if (!/^\d+(\.\d+)?$/.test(text) || Number(text) < min || Number(text) > max)
      return { error: `${key} must be ${min}–${max}` };
    value[key] = Number(text);
  }
  return { value };
}
