# Raw database/sql instead of an ORM

The backend uses `database/sql` with hand-written SQL rather than an ORM (GORM, sqlc, ent, etc.). This was a deliberate choice to learn Go's standard database APIs and SQL directly, not an efficiency or scale decision. A future maintainer should not assume an ORM was rejected for technical reasons on this schema.
