import { Hono } from "hono";
import { iconsRoutes } from "./icons";
import { rootRoutes } from "./root";

export const routes = new Hono();

routes.route("/", rootRoutes);
routes.route("/icons", iconsRoutes);
