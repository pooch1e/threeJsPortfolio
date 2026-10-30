/**
 * Worker entry — Hono app served by Cloudflare Workers (wrangler dev / deploy).
 */
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', (c) => c.json({ check: 'ok' }))



export default app
