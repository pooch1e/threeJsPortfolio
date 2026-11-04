/**
 * Health route tests — runs inside workerd via @cloudflare/vitest-plugin,
 * passing real bindings (env) and an ExecutionContext into the Hono app.
 */
import { describe, it, expect } from 'vitest'
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import app from '../index'
import { env } from 'cloudflare:workers'

describe('GET /health', () => {
  it('returns a 200 for healthy request', async () => {
    const ctx = createExecutionContext()
    const res = await app.request('/health', {}, env, ctx)
    await waitOnExecutionContext(ctx)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ check: 'ok' })
  })
  it('returns a 503 for unhealthy response', async () => {
    const brokenEnv = {
      ...env,
      HYPERDRIVE: { connectionString: 'postgres://nobody:nope@127.0.0.1:1/none' } as Hyperdrive,
    }
    const ctx = createExecutionContext()
    const res = await app.request('/health', {}, brokenEnv, ctx)
    await waitOnExecutionContext(ctx)
  
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ check: 'unhealthy' })
  })
})
