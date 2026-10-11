import { Hono } from "hono";
import { routes } from "./routes";
import { githubRoutes } from "./routes/github";
import { landingRoutes } from "./routes/landing";
import { llmsRoutes } from "./routes/llms";

const app = new Hono();

app.route("/", landingRoutes);
app.route("/", llmsRoutes);
app.route("/api", githubRoutes);
app.route("/v1", routes);

export default app;
