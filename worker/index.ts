/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 * Mounts global middleware and the feature route modules
 */
import { Env } from "./types";
import { Hono } from "hono";
import postgres from 'postgres'
const app = new Hono<Env>();




// db middleware
// sets up db connection per client rather than once at start
app.use('*', async (c, next) => {
  const db = postgres(c.env.HYPERDRIVE.connectionString, { max: 1 })
  c.set('db', db)
  await next();
  c.executionCtx.waitUntil((db.end()));
})


app.get("/health", (c) => c.json({ check: "ok" }));

// signup + login
// unprotected

app.post('/api/signup', )

export default app;
