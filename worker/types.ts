/**
 * Shared Hono environment types — Cloudflare bindings and per-request context
 * variables used by every route and middleware.
 *
 *  - Bindings: DB (D1), JWT_SECRET, APP_ENV
 *  - Variables: userId (set by requireAuth)
 */
type Env = {
  Bindings: { DB: D1Database; JWT_SECRET: string; APP_ENV?: string };

  Variables: { userId: string };
};

export { Env };
