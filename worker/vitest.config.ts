/**
 * Vitest config — runs tests inside workerd with a local, in-memory D1 database. The SQL
 * files in ./migrations are read here (in Node) and handed to the tests as the
 * TEST_MIGRATIONS binding, which __tests__/setup/applyMigrations.ts applies before each file.
 */
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations("./migrations");

export default defineConfig({
	test: {
		setupFiles: ["./__tests__/setup/applyMigrations.ts"],
		// test files share one D1 instance and each clears users in beforeEach
		fileParallelism: false,
	},
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.toml" },
			miniflare: {
				bindings: {
					JWT_SECRET: "test-jwt-secret-at-least-32-characters",
					FRONTEND_URL: "http://localhost:5173",
					TEST_MIGRATIONS: migrations,
				},
			},
		}),
	],
});
