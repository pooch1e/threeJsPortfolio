/**
 * Vitest config — runs tests inside workerd and points the Hyperdrive binding at the
 * threejs_test database so no entry point (npm test, npx vitest, single file) can hit dev data.
 */
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE ??=
	"postgres://threejs_user:threejs_password@localhost:5433/threejs_test";

export default defineConfig({
	test: {
		setupFiles: ["./__tests__/setup/assertTestDb.ts"],
	},
	plugins: [
		cloudflareTest({
			wrangler: { configPath: "./wrangler.toml" },
		}),
	],
});