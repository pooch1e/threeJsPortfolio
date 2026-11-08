/**
 * Types `env` from `cloudflare:workers` (used in tests) with the bindings declared in
 * wrangler.toml and vitest.config.ts. Keep in sync with Bindings in types.ts.
 */
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    APP_ENV?: string;
    FRONTEND_URL: string;
    TEST_MIGRATIONS: import("cloudflare:test").D1Migration[];
  }
}
