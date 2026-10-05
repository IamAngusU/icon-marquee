import { Hono } from "hono";
import { config } from "../../config";
import { landingPage, scriptHash } from "../../landing";
import { logoSvg } from "../../landing/logo";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src '${scriptHash}'`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

export const landingRoutes = new Hono();

landingRoutes.get("/", (c) => {
  c.header("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Cache-Control", `public, max-age=${config.landing.cacheMaxAgeS}`);
  return c.html(landingPage);
});

landingRoutes.get("/logo.svg", (c) => {
  c.header("Content-Type", "image/svg+xml");
  c.header("Cache-Control", `public, max-age=${config.landing.cacheMaxAgeS}`);
  return c.body(logoSvg);
});
