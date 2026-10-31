/**
 * Shared Hono environment types — Cloudflare bindings and per-request context
 * variables used by every route and middleware.
 *
 * Define:
 *  - Bindings: HYPERDRIVE, JWT_SECRET, FRONTEND_URL, APP_ENV
 *  - Variables: sql (postgres client from middleware/db.ts), userId (set by requireAuth)
 *  - AppEnv: { Bindings, Variables } passed as the generic to every `new Hono<AppEnv>()`
 */
export {};
