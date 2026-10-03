import { readdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config";

const ICONS_DIR = join(import.meta.dir, "../../public/icons");

// Icon folder name -> path of the SVG served for it.
const iconPaths: ReadonlyMap<string, string> = new Map(
  readdirSync(ICONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const files = readdirSync(join(ICONS_DIR, entry.name));
      const file = files.includes("auto.svg") ? "auto.svg" : "default.svg";
      return [entry.name, join(ICONS_DIR, entry.name, file)];
    }),
);

export function resolveIconPath(name: string): string | undefined {
  return iconPaths.get(config.icons.aliases[name] ?? name);
}
