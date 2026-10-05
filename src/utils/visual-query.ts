import type { IconRowOptions } from "./svg";

export function visualQuery(
  query: Record<string, string>,
): { value: IconRowOptions } | { error: string } {
  const value: IconRowOptions = {};
  if (query.effect !== undefined) {
    if (!["none", "glint", "chrome", "holo"].includes(query.effect))
      return { error: "effect must be none, glint, chrome or holo" };
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
    ["effectInterval", 0, 30],
    ["effectVariation", 0, 100],
    ["edgeFade", 0, 96],
  ] as const) {
    const text = query[key];
    if (text === undefined) continue;
    if (!/^\d+(\.\d+)?$/.test(text) || Number(text) < min || Number(text) > max)
      return { error: `${key} must be ${min}–${max}` };
    value[key] = Number(text);
  }
  for (const [key, choices] of [
    ["effectArea", ["surface", "border"]],
    ["effectTiming", ["stagger", "random", "sync"]],
    ["effectCoverage", ["all", "some", "selected"]],
  ] as const) {
    const text = query[key];
    if (text === undefined) continue;
    if (!(choices as readonly string[]).includes(text))
      return { error: `Invalid ${key}` };
    Object.assign(value, { [key]: text });
  }
  if (query.effectIndices !== undefined) {
    if (!/^\d{1,2}(,\d{1,2}){0,99}$/.test(query.effectIndices))
      return {
        error: "effectIndices must be comma-separated indices from 0 to 99",
      };
    value.effectIndices = query.effectIndices.split(",").map(Number);
  }
  return { value };
}
