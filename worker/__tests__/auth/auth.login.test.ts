/**
 * Login route tests — exercises POST /auth/login through the full Hono app against the
 * test database. Mirrors the Go contract in server/internal/handlers/login.go: an HS256
 * JWT (sub, iat, exp = iat + 1h) delivered in an HttpOnly `session` cookie, and an
 * identical 401 for unknown user and wrong password.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { verify } from "hono/jwt";
import postgres from "postgres";
import app from "../../index";
import { createUser } from "../../features/auth/auth.queries";
import { hashPassword } from "../../lib/password";

const credentials = { username: "testName123", password: "password123" };
const email = "login@example.com";
const ONE_HOUR_SECONDS = 3600;

async function postLogin(body: unknown, testEnv: object = env) {
  const ctx = createExecutionContext();
  const res = await app.request(
    "/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    },
    testEnv,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
}

function sessionCookie(res: Response) {
  return res.headers.getSetCookie().find((cookie) => cookie.startsWith("session="));
}

function sessionToken(res: Response) {
  return sessionCookie(res)!.split(";")[0].slice("session=".length);
}

describe("POST /auth/login", () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1, transform: postgres.camel });
  let userId: string;

  beforeEach(async () => {
    await sql`TRUNCATE users`;
    const created = await createUser(sql, {
      username: credentials.username,
      email,
      passwordHash: await hashPassword(credentials.password),
    });
    userId = created.userId;
  });

  afterAll(async () => {
    await sql.end();
  });

  describe("success", () => {
    it("returns 200 with the public user fields", async () => {
      const res = await postLogin(credentials);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        id: userId,
        username: credentials.username,
        isAdmin: false,
      });
    });

    it("never leaks the password or its hash in the body", async () => {
      const res = await postLogin(credentials);
      const text = await res.text();

      expect(text).not.toContain(credentials.password);
      expect(text).not.toMatch(/password/i);
    });

    it("does not put the token in the body or an Authorization header", async () => {
      const res = await postLogin(credentials);

      expect(res.headers.get("Authorization")).toBeNull();
      expect(await res.text()).not.toContain(sessionToken(res));
    });
  });

  describe("session cookie", () => {
    it("sets an HttpOnly session cookie scoped to /", async () => {
      const res = await postLogin(credentials);
      const cookie = sessionCookie(res);

      expect(cookie).toBeDefined();
      expect(cookie).toMatch(/;\s*HttpOnly/i);
      expect(cookie).toMatch(/;\s*Path=\//i);
    });

    it("holds an HS256 JWT signed with JWT_SECRET whose sub is the user id", async () => {
      const res = await postLogin(credentials);

      const payload = await verify(sessionToken(res), env.JWT_SECRET, "HS256");

      expect(payload.sub).toBe(userId);
    });

    it("expires one hour after issue", async () => {
      const res = await postLogin(credentials);

      const payload = await verify(sessionToken(res), env.JWT_SECRET, "HS256");

      expect(payload.exp! - payload.iat!).toBe(ONE_HOUR_SECONDS);
    });

    it("is not verifiable with a different secret", async () => {
      const res = await postLogin(credentials);

      await expect(verify(sessionToken(res), "some-other-secret", "HS256")).rejects.toThrow();
    });

    it("uses SameSite=Lax and no Secure flag outside production", async () => {
      const cookie = sessionCookie(await postLogin(credentials));

      expect(cookie).toMatch(/;\s*SameSite=Lax/i);
      expect(cookie).not.toMatch(/;\s*Secure/i);
    });

    it("uses SameSite=None and Secure in production", async () => {
      const cookie = sessionCookie(await postLogin(credentials, { ...env, APP_ENV: "production" }));

      expect(cookie).toMatch(/;\s*SameSite=None/i);
      expect(cookie).toMatch(/;\s*Secure/i);
    });
  });

  describe("invalid credentials", () => {
    it("returns 401 for a wrong password", async () => {
      const res = await postLogin({ ...credentials, password: "wrongpassword" });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Invalid credentials" });
    });

    it("returns 401 for an unknown username", async () => {
      const res = await postLogin({ ...credentials, username: "nobodyHere" });

      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "Invalid credentials" });
    });

    it("gives unknown-user and wrong-password the same body so usernames cannot be enumerated", async () => {
      const wrongPassword = await postLogin({ ...credentials, password: "wrongpassword" });
      const unknownUser = await postLogin({ ...credentials, username: "nobodyHere" });

      expect(await unknownUser.json()).toEqual(await wrongPassword.json());
    });

    it("does not set a cookie on failure", async () => {
      const wrongPassword = await postLogin({ ...credentials, password: "wrongpassword" });
      const unknownUser = await postLogin({ ...credentials, username: "nobodyHere" });

      expect(sessionCookie(wrongPassword)).toBeUndefined();
      expect(sessionCookie(unknownUser)).toBeUndefined();
    });

    it("treats the password as case-sensitive", async () => {
      const res = await postLogin({ ...credentials, password: credentials.password.toUpperCase() });

      expect(res.status).toBe(401);
    });

    it("treats SQL metacharacters in the username as literal data", async () => {
      const res = await postLogin({ ...credentials, username: "' OR '1'='1" });

      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it.each([
      ["missing username", { password: credentials.password }],
      ["missing password", { username: credentials.username }],
      ["empty username", { ...credentials, username: "" }],
      ["empty password", { ...credentials, password: "" }],
      ["username over 20 characters", { ...credentials, username: "a".repeat(21) }],
      ["non-string password", { ...credentials, password: 12345678 }],
      ["empty object", {}],
    ])("returns 400 for %s", async (_name, body) => {
      const res = await postLogin(body);

      expect(res.status).toBe(400);
      expect(sessionCookie(res)).toBeUndefined();
    });

    it("returns 400 for a malformed JSON body", async () => {
      const res = await postLogin("{not json");

      expect(res.status).toBe(400);
    });
  });

  describe("server errors", () => {
    it("returns 500 when the database is unreachable", async () => {
      const brokenEnv = {
        ...env,
        HYPERDRIVE: { connectionString: "postgres://nobody:nope@127.0.0.1:1/none" } as Hyperdrive,
      };

      const res = await postLogin(credentials, brokenEnv);

      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "Internal server error" });
      expect(sessionCookie(res)).toBeUndefined();
    });
  });
});
