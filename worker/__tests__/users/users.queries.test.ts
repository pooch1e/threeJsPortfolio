/**
 * User query tests — findUserById against the test database.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { env } from "cloudflare:workers";
import postgres from "postgres";
import { createUser } from "../../features/auth/auth.queries";
import { findUserById } from "../../features/users/users.queries";
import { UserNotFoundError } from "../../lib/errors";

describe("users sql queries", () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, {
    max: 1,
    transform: postgres.camel,
  });

  beforeEach(async () => {
    await sql`TRUNCATE users`;
  });

  afterAll(async () => {
    await sql.end();
  });

  describe("findUserById", () => {
    it("returns the user without the password hash", async () => {
      const { userId } = await createUser(sql, {
        username: "finder",
        email: "finder@example.com",
        passwordHash: "hash",
      });

      const user = await findUserById(sql, userId);

      expect(user).toEqual({
        userId,
        username: "finder",
        email: "finder@example.com",
        isAdmin: false,
      });
      expect(user).not.toHaveProperty("passwordHash");
    });

    it("reflects the admin flag", async () => {
      const { userId } = await createUser(sql, {
        username: "boss",
        email: "boss@example.com",
        passwordHash: "hash",
      });
      await sql`UPDATE users SET is_admin = true WHERE id = ${userId}`;

      const user = await findUserById(sql, userId);

      expect(user.isAdmin).toBe(true);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(
        findUserById(sql, "00000000-0000-0000-0000-000000000000"),
      ).rejects.toThrow(UserNotFoundError);
    });
  });
});
