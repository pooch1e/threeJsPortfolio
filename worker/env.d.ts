/**
 * Types `env` from `cloudflare:workers` (used in tests) with the bindings declared in
 * wrangler.toml. Keep in sync with Bindings in types.ts.
 */
declare namespace Cloudflare {
  interface Env {
    HYPERDRIVE: Hyperdrive;
    JWT_SECRET: string;
    APP_ENV?: string;
  }
}
