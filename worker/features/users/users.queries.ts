/**
 * User queries — SQL for reading and administering users.
 */
import postgres, { type Sql } from "postgres";
import { DuplicateFoundError, UserNotFoundError } from "../../lib/errors";

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
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    isAdmin: row.isAdmin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findUserById(sql: Sql, id: string): Promise<UserRecord> {
  const [row] = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_COLUMNS)} FROM users WHERE id = ${id}
  `;
  if (!row) throw new UserNotFoundError();
  return toUserRecord(row);
}

async function listUsers(sql: Sql, limit: number, offset: number): Promise<UserRecord[]> {
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_COLUMNS)} FROM users
    ORDER BY created_at DESC, id
    LIMIT ${limit} OFFSET ${offset}
  `;
  return rows.map(toUserRecord);
}

async function countUsers(sql: Sql): Promise<number> {
  const [{ count }] = await sql<{ count: string }[]>`SELECT COUNT(*) AS count FROM users`;
  return Number(count);
}

async function updateUser(sql: Sql, id: string, fields: UpdateUserFields): Promise<UserRecord> {
  try {
    const [row] = await sql<UserRow[]>`
      UPDATE users SET
        name = COALESCE(${fields.name ?? null}, name),
        email = COALESCE(${fields.email ?? null}, email),
        is_admin = COALESCE(${fields.isAdmin ?? null}, is_admin)
      WHERE id = ${id}
      RETURNING ${sql.unsafe(USER_COLUMNS)}
    `;
    if (!row) throw new UserNotFoundError();
    return toUserRecord(row);
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === "23505") {
      throw new DuplicateFoundError("An account with this email already exists");
    }
    throw err;
  }
}

async function deleteUser(sql: Sql, id: string): Promise<void> {
  const result = await sql`DELETE FROM users WHERE id = ${id}`;
  if (result.count === 0) throw new UserNotFoundError();
}

async function setPasswordHash(sql: Sql, id: string, passwordHash: string): Promise<void> {
  const result = await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}`;
  if (result.count === 0) throw new UserNotFoundError();
}

export { findUserById, listUsers, countUsers, updateUser, deleteUser, setPasswordHash };
export type { UserRecord, UpdateUserFields };
