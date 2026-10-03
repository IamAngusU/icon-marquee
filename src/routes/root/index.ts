import { Hono } from "hono";

export const rootRoutes = new Hono();

rootRoutes.get("/", (c) => c.json({ status: "ok" }));
