# Raw database/sql instead of an ORM

> **Historical / deprecated.** This documents the Go + Cloud Run + Postgres backend, a learning project replaced by the Cloudflare Worker in `worker/`. It is no longer deployed or maintained. Why: [ADR 0002](../../../docs/adr/0002-move-to-cloudflare.md).

The backend uses `database/sql` with hand-written SQL rather than an ORM (GORM, sqlc, ent, etc.). This was a deliberate choice to learn Go's standard database APIs and SQL directly, not an efficiency or scale decision. A future maintainer should not assume an ORM was rejected for technical reasons on this schema.
