/**
 * User query tests — findUserById, listUsers, countUsers, updateUser, deleteUser and
 * setPasswordHash against the test database.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { env } from "cloudflare:workers";
import postgres from "postgres";
import { createUser } from "../../features/auth/auth.queries";
import {
  countUsers,
  deleteUser,
  findUserById,
  listUsers,
  setPasswordHash,
  updateUser,
} from "../../features/users/users.queries";
import { DuplicateFoundError, UserNotFoundError } from "../../lib/errors";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

describe("users sql queries", () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, {
    max: 1,
    transform: postgres.camel,
  });

  async function makeUser(username: string) {
    const { userId } = await createUser(sql, {
      username,
      email: `${username}@example.com`,
      passwordHash: "hash",
    });
    return userId;
  }

  beforeEach(async () => {
    await sql`TRUNCATE users`;
  });

  afterAll(async () => {
    await sql.end();
  });

  describe("findUserById", () => {
    it("returns the user without the password hash", async () => {
      const userId = await makeUser("finder");

      const user = await findUserById(sql, userId);

      expect(user).toMatchObject({
        userId,
        username: "finder",
        email: "finder@example.com",
        isAdmin: false,
      });
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user).not.toHaveProperty("passwordHash");
    });

    it("falls back to the username when no display name is set", async () => {
      const userId = await makeUser("nameless");

      expect((await findUserById(sql, userId)).name).toBe("nameless");
    });

    it("reflects the admin flag", async () => {
      const userId = await makeUser("boss");
      await sql`UPDATE users SET is_admin = true WHERE id = ${userId}`;

      expect((await findUserById(sql, userId)).isAdmin).toBe(true);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(findUserById(sql, MISSING_ID)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("listUsers and countUsers", () => {
    it("returns newest users first", async () => {
      await makeUser("first");
      await sql`SELECT pg_sleep(0.01)`;
      await makeUser("second");

      const users = await listUsers(sql, 10, 0);

      expect(users.map((u) => u.username)).toEqual(["second", "first"]);
    });

    it("applies limit and offset", async () => {
      for (const name of ["a", "b", "c"]) {
        await makeUser(name);
        await sql`SELECT pg_sleep(0.01)`;
      }

      const page = await listUsers(sql, 1, 1);

      expect(page.map((u) => u.username)).toEqual(["b"]);
    });

    it("never includes the password hash", async () => {
      await makeUser("safe");

      const [user] = await listUsers(sql, 10, 0);

      expect(user).not.toHaveProperty("passwordHash");
    });

    it("counts every user regardless of paging", async () => {
      await makeUser("one");
      await makeUser("two");

      expect(await countUsers(sql)).toBe(2);
    });

    it("counts zero for an empty table", async () => {
      expect(await countUsers(sql)).toBe(0);
    });
  });

  describe("updateUser", () => {
    it("updates only the provided fields", async () => {
      const userId = await makeUser("editme");

      const updated = await updateUser(sql, userId, { name: "New Name" });

      expect(updated.name).toBe("New Name");
      expect(updated.email).toBe("editme@example.com");
      expect(updated.isAdmin).toBe(false);
    });

    it("treats null as unchanged", async () => {
      const userId = await makeUser("nulls");

      const updated = await updateUser(sql, userId, { name: null, email: null, isAdmin: null });

      expect(updated.email).toBe("nulls@example.com");
      expect(updated.isAdmin).toBe(false);
    });

    it("can promote and demote an admin", async () => {
      const userId = await makeUser("promote");

      expect((await updateUser(sql, userId, { isAdmin: true })).isAdmin).toBe(true);
      expect((await updateUser(sql, userId, { isAdmin: false })).isAdmin).toBe(false);
    });

    it("bumps updatedAt", async () => {
      const userId = await makeUser("touched");
      const before = await findUserById(sql, userId);
      await sql`SELECT pg_sleep(0.01)`;

      const after = await updateUser(sql, userId, { name: "Touched" });

      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    });

    it("throws DuplicateFoundError when the email belongs to someone else", async () => {
      await makeUser("taken");
      const userId = await makeUser("other");

      await expect(
        updateUser(sql, userId, { email: "taken@example.com" }),
      ).rejects.toThrow(DuplicateFoundError);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(updateUser(sql, MISSING_ID, { name: "x" })).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("deleteUser", () => {
    it("removes the user", async () => {
      const userId = await makeUser("doomed");

      await deleteUser(sql, userId);

      await expect(findUserById(sql, userId)).rejects.toThrow(UserNotFoundError);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(deleteUser(sql, MISSING_ID)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("setPasswordHash", () => {
    it("stores the new hash", async () => {
      const userId = await makeUser("rehash");

      await setPasswordHash(sql, userId, "new-hash");

      const [row] = await sql`SELECT password_hash FROM users WHERE id = ${userId}`;
      expect(row.passwordHash).toBe("new-hash");
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(setPasswordHash(sql, MISSING_ID, "x")).rejects.toThrow(UserNotFoundError);
    });
  });
});
