import { config } from "../config";
import { resolveIconPath } from "./registry";

const MAX_ICONS = config.icons.maxPerRequest;
const svgCache = new Map<string, Promise<string>>();

function readIcon(path: string): Promise<string> {
  const cached = svgCache.get(path);
  if (cached) return cached;
  const pending = Bun.file(path)
    .text()
    .catch((error: unknown) => {
      svgCache.delete(path);
      throw error;
    });
  svgCache.set(path, pending);
  return pending;
}

export type LoadIconsResult =
  | { svgs: string[]; names: string[]; unknown: string[] }
  | { error: string };

export async function loadIcons(
  param: string | undefined,
): Promise<LoadIconsResult> {
  const names = (param ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  if (names.length === 0) {
    return { error: "Query param 'i' is required, e.g. ?i=js,html,css" };
  }
  if (names.length > MAX_ICONS) {
    return { error: `At most ${MAX_ICONS} icons per request` };
  }

  const paths = names.flatMap((name) => resolveIconPath(name) ?? []);
  const unknown = names.filter((name) => !resolveIconPath(name));
  if (paths.length === 0) {
    return { error: `No known icons: ${unknown.join(", ")}` };
  }

  const svgs = await Promise.all(paths.map(readIcon));
  return {
    svgs,
    names: names.filter((name) => resolveIconPath(name)),
    unknown,
  };
}
