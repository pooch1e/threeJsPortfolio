import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { env } from "cloudflare:workers";
import postgres from "postgres";
import { createUser } from "../../features/auth/auth.queries";

describe("auth sql queries", () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, {
    max: 1,
    transform: postgres.camel,
  });
  const email = "test128@example.com";

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
      expect(typeof result).toBe("string");
    });
    it("rejects duplicate usernames with an error", async () => {
      await createUser(sql, {
        username: "test",
        email,
        passwordHash: "asjkdjaksjd",
      });
      const result2 = await createUser(sql, {
        username: "test",
        email,
        passwordHash: "asjkdjaksjd",
      });
      expect(result2).toContain('email already exists');
    });
  });
});
