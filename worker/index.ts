/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 * Mounts global middleware and the feature route modules
 */
import { Env } from "./types";
import { Hono } from "hono";
import {publicAuthRoutes} from "./features/auth/auth.routes";
import {sessionRoutes} from "./features/auth/auth.session.routes";
import { meRoutes, adminRoutes } from "./features/users/users.routes";
import { requireAuth } from "./middleware/auth";
import { HTTPException } from "hono/http-exception";
import { AppError } from "./lib/errors";
import {cors} from 'hono/cors'

const app = new Hono<Env>();

// enable cors in local dev, will need actual url when deployed
app.use("*", cors({ origin: "http://localhost:5173", credentials: true }));

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  if (err instanceof AppError) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

// Unauthenticated
app.get("/health", async (c) => {
  try {
    await c.env.DB.prepare("SELECT 1").first();
    return c.json({ check: "ok" });
  } catch {
    return c.json({ check: "unhealthy" }, 503);
  }
});

const api = new Hono<Env>();

// Public: registered before requireAuth, so they respond without ever reaching it
api.route("/", publicAuthRoutes);
api.route("/", sessionRoutes);

// Protected: everything registered below this line requires a valid session
api.use("*", requireAuth);
api.route("/", meRoutes);
api.route("/admin", adminRoutes);

app.route("/api", api);

export default app;
