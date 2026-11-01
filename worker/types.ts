/**
 * Shared Hono environment types — Cloudflare bindings and per-request context
 * variables used by every route and middleware.
 *
 * Define:
 *  - Bindings: HYPERDRIVE, JWT_SECRET, FRONTEND_URL, APP_ENV
 *  - Variables: sql (postgres client from middleware/db.ts), userId (set by requireAuth)
 *  - AppEnv: { Bindings, Variables } passed as the generic to every `new Hono<AppEnv>()`
 */
import type postgres from "postgres";

type Env = {
  Bindings: { HYPERDRIVE: Hyperdrive, JWT_SECRET: string };
  Variables: { db: ReturnType<typeof postgres> };
}

export { Env};
