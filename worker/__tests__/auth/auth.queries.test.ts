import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { env } from "cloudflare:workers";
import postgres, { type Sql } from "postgres";
import { createUser, DuplicateFoundError, findUserByUsername, UserNotFoundError } from "../../features/auth/auth.queries";

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
    it("returns an ok status on success", async () => {
      const result = await createUser(sql, {
        username: "test",
        email,
        passwordHash: "asjkdjaksjd",
      });
      expect(result.status).toBe("ok");
    })
    it("rejects duplicate usernames with an error", async () => {
      const user = { username: "test", email, passwordHash: "asjkdjaksjd" };

      await createUser(sql, user);

      await expect(createUser(sql, user)).rejects.toThrow(DuplicateFoundError);
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
        status: "ok",
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
      await expect(findUserByUsername(sql, username)).rejects.toThrow("user not found");
    });

    it("matches usernames case-sensitively", async () => {
      await createUser(sql, { username, email, passwordHash: "asjkdjaksjd" });

      await expect(findUserByUsername(sql, username.toUpperCase())).rejects.toThrow(UserNotFoundError);
    });

    it("treats SQL metacharacters as literal data", async () => {
      await createUser(sql, { username, email, passwordHash: "asjkdjaksjd" });

      await expect(findUserByUsername(sql, "' OR '1'='1")).rejects.toThrow(UserNotFoundError);
    });

    describe("database error mapping", () => {
      const sqlThatFailsWith = (error: unknown) =>
        (() => Promise.reject(error)) as unknown as Sql;

      const postgresErrorWithCode = (code: string) =>
        Object.assign(Object.create(postgres.PostgresError.prototype), {
          message: `simulated ${code}`,
          code,
        });

      it("maps unique violation (23505) to DuplicateFoundError", async () => {
        const failingSql = sqlThatFailsWith(postgresErrorWithCode("23505"));

        await expect(findUserByUsername(failingSql, username)).rejects.toThrow(DuplicateFoundError);
      });

      it("maps foreign key violation (23503) to UserNotFoundError", async () => {
        const failingSql = sqlThatFailsWith(postgresErrorWithCode("23503"));

        await expect(findUserByUsername(failingSql, username)).rejects.toThrow("user violates fk");
      });

      it("rethrows postgres errors with unmapped codes unchanged", async () => {
        const original = postgresErrorWithCode("42P01");
        const failingSql = sqlThatFailsWith(original);

        await expect(findUserByUsername(failingSql, username)).rejects.toBe(original);
      });

      it("rethrows non-postgres errors unchanged", async () => {
        const original = new Error("connection reset");
        const failingSql = sqlThatFailsWith(original);

        await expect(findUserByUsername(failingSql, username)).rejects.toBe(original);
      });
    });
    })
});
