import { Hono } from "hono";
import { config } from "../../config";
import { llmsText } from "../../llms";

export const llmsRoutes = new Hono();

llmsRoutes.get("/llms.txt", (c) => {
  c.header("Content-Type", "text/plain; charset=utf-8");
  c.header("Cache-Control", `public, max-age=${config.landing.cacheMaxAgeS}`);
  return c.body(llmsText(new URL(c.req.url).origin));
});
