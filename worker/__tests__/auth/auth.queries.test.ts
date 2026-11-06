import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { env } from "cloudflare:workers";
import postgres, { type Sql } from "postgres";
import { createUser, findUserByUsername } from "../../features/auth/auth.queries";
import { AppError, DuplicateFoundError, UserNotFoundError } from "../../lib/errors";

describe("auth sql queries", () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, {
    max: 1,
    transform: postgres.camel,
  });
  const email = "test128@example.com";
  const username = "testName123"

  beforeEach(async () => {
    await sql`TRUNCATE users`;
  });

  afterAll(async () => {
    await sql.end();
  });

  describe("createUser", () => {
    it("creates a user and returns user id on success", async () => {
      const result = await createUser(sql, {
        username: "test",
        email,
        passwordHash: "asjkdjaksjd",
      });
      expect(typeof result.userId).toBe("string");
    });
    it("rejects duplicate usernames with an error", async () => {
      const user = { username: "test", email, passwordHash: "asjkdjaksjd" };

      await createUser(sql, user);

      await expect(createUser(sql, user)).rejects.toThrow(DuplicateFoundError);
    });
    it("carries a 409 status on the duplicate error", async () => {
      const user = { username: "test", email, passwordHash: "asjkdjaksjd" };
      await createUser(sql, user);

      const error = await createUser(sql, user).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(409);
    });
  });
  describe("findUserByUsername", () => {
    it("finds user by username", async () => {
        const makeUser = await createUser(sql, {
        username,
        email,
        passwordHash: "asjkdjaksjd",
        });
      const user = await findUserByUsername(sql, username)
      expect(user.username).toBe(username)
      })

    it("returns the user id, stored password hash and isAdmin flag", async () => {
      const created = await createUser(sql, { username, email, passwordHash: "stored-hash" });

      const user = await findUserByUsername(sql, username);

      expect(user).toEqual({
        userId: created.userId,
        username,
        passwordHash: "stored-hash",
        isAdmin: false,
      });
    });

    it("returns isAdmin true for an admin user", async () => {
      await createUser(sql, { username, email, passwordHash: "stored-hash" });
      await sql`UPDATE users SET is_admin = true WHERE username = ${username}`;

      const user = await findUserByUsername(sql, username);

      expect(user.isAdmin).toBe(true);
    });

    it("throws UserNotFoundError when no user has that username", async () => {
      await expect(findUserByUsername(sql, "nobodyHere")).rejects.toThrow(UserNotFoundError);
    });

    it("throws UserNotFoundError on an empty table", async () => {
      await expect(findUserByUsername(sql, username)).rejects.toThrow("User not found");
    });

    it("matches usernames case-sensitively", async () => {
      await createUser(sql, { username, email, passwordHash: "asjkdjaksjd" });

      await expect(findUserByUsername(sql, username.toUpperCase())).rejects.toThrow(UserNotFoundError);
    });

    it("treats SQL metacharacters as literal data", async () => {
      await createUser(sql, { username, email, passwordHash: "asjkdjaksjd" });

      await expect(findUserByUsername(sql, "' OR '1'='1")).rejects.toThrow(UserNotFoundError);
    });

    describe("database errors", () => {
      const sqlThatFailsWith = (error: unknown) =>
        (() => Promise.reject(error)) as unknown as Sql;

      const postgresErrorWithCode = (code: string) =>
        Object.assign(Object.create(postgres.PostgresError.prototype), {
          message: `simulated ${code}`,
          code,
        });

      it.each(["23505", "23503", "42P01"])(
        "rethrows postgres error %s unchanged since a lookup has no constraints to map",
        async (code) => {
          const original = postgresErrorWithCode(code);

          await expect(findUserByUsername(sqlThatFailsWith(original), username)).rejects.toBe(original);
        },
      );

      it("rethrows non-postgres errors unchanged", async () => {
        const original = new Error("connection reset");

        await expect(findUserByUsername(sqlThatFailsWith(original), username)).rejects.toBe(original);
      });
    });
    })
});
