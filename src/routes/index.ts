import { Hono } from "hono";
import { rootRoutes } from "./root";

export const routes = new Hono();

routes.route("/", rootRoutes);
