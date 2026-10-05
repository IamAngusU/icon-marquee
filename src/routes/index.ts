import { Hono } from "hono";
import { assetsRoutes } from "./assets";
import { catalogRoutes } from "./catalog";
import { iconsRoutes } from "./icons";
import { marqueeRoutes } from "./marquee";
import { rootRoutes } from "./root";

export const routes = new Hono();

routes.route("/", rootRoutes);
routes.route("/assets", assetsRoutes);
routes.route("/catalog", catalogRoutes);
routes.route("/icons", iconsRoutes);
routes.route("/marquee", marqueeRoutes);
