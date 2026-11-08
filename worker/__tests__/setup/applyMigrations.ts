/**
 * Vitest setup — applies every migration in ./migrations to the test D1 database before
 * each test file. applyD1Migrations records what it ran, so repeat calls are no-ops.
 */
import { beforeAll } from "vitest";
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});
