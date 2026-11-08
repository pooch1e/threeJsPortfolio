/**
 * User queries — SQL for reading and administering users.
 * Rows come back from D1 in snake_case with is_admin as 0/1 and timestamps as ISO text;
 * toUserRecord turns them into the camelCase, boolean and Date shape the routes use.
 */
import { DuplicateFoundError, UserNotFoundError } from "../../lib/errors";
import { SQL_NOW, uniqueViolationColumn } from "../../lib/db";

type UserRecord = {
  userId: string;
  name: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type UserRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  is_admin: number;
  created_at: string;
  updated_at: string;
};

type UpdateUserFields = {
  name?: string | null;
  email?: string | null;
  isAdmin?: boolean | null;
};

const USER_COLUMNS = `id, COALESCE(name, username) AS name, username, email, is_admin, created_at, updated_at`;

function toUserRecord(row: UserRow): UserRecord {
  return {
    userId: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    isAdmin: row.is_admin === 1,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function toSqlBoolean(value: boolean | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value ? 1 : 0;
}

async function findUserById(db: D1Database, id: string): Promise<UserRecord> {
  const row = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`)
    .bind(id)
    .first<UserRow>();
  if (!row) throw new UserNotFoundError();
  return toUserRecord(row);
}

async function listUsers(db: D1Database, limit: number, offset: number): Promise<UserRecord[]> {
  const { results } = await db
    .prepare(`SELECT ${USER_COLUMNS} FROM users ORDER BY created_at DESC, id LIMIT ? OFFSET ?`)
    .bind(limit, offset)
    .all<UserRow>();
  return results.map(toUserRecord);
}

async function countUsers(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  return row?.count ?? 0;
}

async function updateUser(db: D1Database, id: string, fields: UpdateUserFields): Promise<UserRecord> {
  try {
    const row = await db
      .prepare(
        `UPDATE users SET
           name = COALESCE(?, name),
           email = COALESCE(?, email),
           is_admin = COALESCE(?, is_admin),
           updated_at = ${SQL_NOW}
         WHERE id = ?
         RETURNING ${USER_COLUMNS}`,
      )
      .bind(fields.name ?? null, fields.email ?? null, toSqlBoolean(fields.isAdmin), id)
      .first<UserRow>();
    if (!row) throw new UserNotFoundError();
    return toUserRecord(row);
  } catch (err) {
    if (uniqueViolationColumn(err) === "email") {
      throw new DuplicateFoundError("An account with this email already exists");
    }
    throw err;
  }
}

async function deleteUser(db: D1Database, id: string): Promise<void> {
  const { meta } = await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
  if (meta.changes === 0) throw new UserNotFoundError();
}

async function setPasswordHash(db: D1Database, id: string, passwordHash: string): Promise<void> {
  const { meta } = await db
    .prepare(`UPDATE users SET password_hash = ?, updated_at = ${SQL_NOW} WHERE id = ?`)
    .bind(passwordHash, id)
    .run();
  if (meta.changes === 0) throw new UserNotFoundError();
}

export { findUserById, listUsers, countUsers, updateUser, deleteUser, setPasswordHash };
export type { UserRecord, UpdateUserFields };
