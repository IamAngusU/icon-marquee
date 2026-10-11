import app from "./index";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "127.0.0.1";

Bun.serve({
  fetch: app.fetch,
  hostname,
  port,
});

console.log(`Icon Marquee listening on http://${hostname}:${port}`);
