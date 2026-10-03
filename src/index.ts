import { Hono } from "hono";
import { routes } from "./routes";
import { landingRoutes } from "./routes/landing";

const app = new Hono();

app.route("/", landingRoutes);
app.route("/v1", routes);

export default app;
