/**
 * Test database helpers — direct access to the test D1 binding for arranging and
 * inspecting rows, plus a D1 stand-in whose every query fails, for outage tests.
 */
import { env } from "cloudflare:workers";

export const db = env.DB;

export async function clearUsers() {
  await db.prepare("DELETE FROM users").run();
}

export async function makeAdmin(userId: string) {
  await db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").bind(userId).run();
}

export async function deleteUserRow(userId: string) {
  await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
}

export async function storedPasswordHash(userId: string) {
  const row = await db
    .prepare("SELECT password_hash FROM users WHERE id = ?")
    .bind(userId)
    .first<{ password_hash: string }>();
  return row?.password_hash;
}

export async function storedPasswordHashes() {
  const { results } = await db.prepare("SELECT password_hash FROM users").all<{ password_hash: string }>();
  return results.map((row) => row.password_hash);
}

export async function countRows() {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  return row?.count ?? 0;
}

/** Waits long enough for SQLite's millisecond clock to tick, so created_at values differ. */
export function tick(ms = 10) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A D1Database whose queries all reject, mimicking an unreachable database. */
export function failingDb(error: unknown = new Error("D1 unavailable")): D1Database {
  const statement = {
    bind: () => statement,
    first: () => Promise.reject(error),
    all: () => Promise.reject(error),
    run: () => Promise.reject(error),
    raw: () => Promise.reject(error),
  };
  return { prepare: () => statement } as unknown as D1Database;
}
