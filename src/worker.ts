import { Hono } from "hono";
import { actions, middleware, pages, trailingSlash } from "astro/hono";
import { cf } from "@astrojs/cloudflare/hono";
import { authRoutes } from "./api/routes/auth";
import { contentRoutes } from "./api/routes/content";
import { adminRoutes } from "./api/routes/admin";
import { benbenRoutes } from "./api/routes/benben";

/** Astro `trailingSlash: "always"` — accept `/api/...` and `/api/.../` alike. */
const app = new Hono<{ Bindings: Env }>({ strict: false });

app.use(cf());
app.use(trailingSlash());

app.route("/api/auth", authRoutes);
app.route("/api/content", contentRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/benben", benbenRoutes);

app.use(actions());
app.use(middleware());
app.use(pages());

export default app;
export { BenbenDurableObject } from "./durable-objects/benben";
