import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { env } from "cloudflare:workers";
import postgres from "postgres";
import { createUser, DuplicateFoundError, findUserByUsername } from "../../features/auth/auth.queries";

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
      console.log(makeUser)
      const user = await findUserByUsername(sql, username)
      console.log(user)
      })
    })
});


