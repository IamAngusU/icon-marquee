import { config } from "../config";
import { resolveIconPath } from "./registry";

const MAX_ICONS = config.icons.maxPerRequest;

export type LoadIconsResult = { svgs: string[] } | { error: string };

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

  const unknown = names.filter((name) => !resolveIconPath(name));
  if (unknown.length > 0) {
    return { error: `Unknown icons: ${unknown.join(", ")}` };
  }

  const paths = names.flatMap((name) => resolveIconPath(name) ?? []);
  const svgs = await Promise.all(paths.map((path) => Bun.file(path).text()));
  return { svgs };
}
