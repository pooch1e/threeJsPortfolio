/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 * Mounts global middleware and the feature route modules
 */
import { Env } from "./types";
import { Hono } from "hono";
import postgres from "postgres";
import authRoutes from "./features/auth/auth.routes";
const app = new Hono<Env>();



// db middleware
// sets up db connection per client rather than once at start
app.use("*", async (c, next) => {
  const db = postgres(c.env.HYPERDRIVE.connectionString, { max: 1, transform: postgres.camel });
  c.set("db", db);
  await next();
  c.executionCtx.waitUntil(db.end());
});

app.get("/health", async (c) => {
  try {
    await c.get("db")`select 1`;
    return c.json({ check: "ok" });
  } catch {
    return c.json({ check: "unhealthy" }, 503);
  }
});

// Sign up
app.route('/auth', authRoutes)


// unprotected

export default app;
