/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 * Mounts global middleware and the feature route modules
 */
import { Env } from "./types";
import { Hono } from "hono";
import postgres from "postgres";
import authRoutes from "./features/auth/auth.routes";
import { jwt } from "hono/jwt";
import { JwtVariables } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { AppError } from "./lib/errors";

const app = new Hono<Env>();

// db middleware
// sets up db connection per client rather than once at start
app.use("*", async (c, next) => {
  const db = postgres(c.env.HYPERDRIVE.connectionString, { max: 1, transform: postgres.camel });
  c.set("db", db);
  await next();
  c.executionCtx.waitUntil(db.end());
});

app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse();
  if (err instanceof AppError) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

app.get("/health", async (c) => {
  try {
    await c.get("db")`select 1`;
    return c.json({ check: "ok" });
  } catch {
    return c.json({ check: "unhealthy" }, 503);
  }
});

app.use('/admin/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: 'HS256',
  })
  return jwtMiddleware(c, next)
})

// Auth routes
// Sign up
app.route('/auth', authRoutes)

// unprotected

export default app;
