/**
 * Vitest setup — aborts every test file unless the Hyperdrive binding points at
 * threejs_test, so a misconfigured override can never run tests against dev data.
 */
import { beforeAll } from 'vitest'
import { env } from 'cloudflare:workers'
import postgres from 'postgres'

beforeAll(async () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1 })
  try {
    const [{ db }] = await sql`SELECT current_database() AS db`
    if (db !== 'threejs_test') {
      throw new Error(`Refusing to run tests against "${db}"; expected "threejs_test"`)
    }
  } finally {
    await sql.end()
  }
})
