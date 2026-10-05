import { Hono } from "hono";
import { config } from "../../config";
import { iconNames } from "../../utils/registry";

export const catalogRoutes = new Hono();

catalogRoutes.get("/", (c) => {
  c.header("Cache-Control", `public, max-age=${config.icons.cacheMaxAgeS}`);
  return c.json({ names: iconNames, aliases: config.icons.aliases });
});
