import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config";

const ICONS_DIR = fileURLToPath(new URL("../../public/icons", import.meta.url));

const SVG_EXTENSION = ".svg";

// Icon name -> path of its SVG file.
const iconPaths: ReadonlyMap<string, string> = new Map(
  readdirSync(ICONS_DIR)
    .filter((file) => file.endsWith(SVG_EXTENSION))
    .map((file) => [
      file.slice(0, -SVG_EXTENSION.length),
      join(ICONS_DIR, file),
    ]),
);

export function resolveIconPath(name: string): string | undefined {
  return iconPaths.get(config.icons.aliases[name] ?? name);
}

export const iconCount = iconPaths.size;

export const iconNames: readonly string[] = [...iconPaths.keys()].sort();
