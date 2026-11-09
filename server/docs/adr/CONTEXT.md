# Backend — Go REST API

> **Historical / deprecated.** This documents the Go + Cloud Run + Postgres backend, a learning project replaced by the Cloudflare Worker in `worker/`. It is no longer deployed or maintained. Why: [ADR 0002](../../../docs/adr/0002-move-to-cloudflare.md).

A stateless-JWT auth API serving the portfolio frontend, backed by PostgreSQL. Deployed separately from the frontend.

## Language

**Session**:
The logged-in state established by the HttpOnly JWT stored in the `session` cookie (HS256, 1-hour expiry). Stateless — no server-side record backs it today.
_Avoid_: token (when referring to the logged-in state itself; "token" is fine for the JWT string), the `sessions` DB table (unused, reserved for future revocable-token support — not part of this term)

**User**:
An account in the system, identified by UUID. May be authenticated via local username/password or a linked GitHub ID.

**Admin**:
A User with elevated permissions (`is_admin`), able to manage other Users. Not a separate identity — every Admin is a User first.
