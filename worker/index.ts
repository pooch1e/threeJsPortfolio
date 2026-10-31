/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 */
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ check: "ok" }));

// Public routes — no auth required.
//login
//signup
app.post("/api/signup", signupModel);
app.post("/api/login", loginModel);

export default app;
