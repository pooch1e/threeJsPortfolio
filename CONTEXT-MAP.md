# Context Map

## Contexts

- [Frontend](./CONTEXT.md) — creative Three.js/React portfolio (Cloudflare Workers static assets)
- Backend — Hono API on Cloudflare Workers + D1, see [worker/PLAN.md](./worker/PLAN.md)
- [Go backend (deprecated)](./server/docs/adr/CONTEXT.md) — historical learning project, replaced by the Worker ([why](./docs/adr/0002-move-to-cloudflare.md))

## Relationships

- **Frontend → Backend**: Frontend calls the Worker's REST API over HTTP for auth and admin data; no shared code or types between them.
