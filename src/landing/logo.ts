import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const logoSvg = readFileSync(
  fileURLToPath(new URL("../../public/logo.svg", import.meta.url)),
  "utf8",
);
