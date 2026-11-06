/**
 * Middleware tests — requireAuth and requireAdmin mounted on a minimal Hono app so the
 * 401 and 403 contracts are checked independent of how index.ts wires its routes.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import postgres from "postgres";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/admin";
import { createUser } from "../../features/auth/auth.queries";
import { AppError } from "../../lib/errors";
import type { Env } from "../../types";

const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1, transform: postgres.camel });

const app = new Hono<Env>();
app.use("*", async (c, next) => {
  c.set("db", sql);
  await next();
});
app.onError((err, c) => {
  if (err instanceof AppError) return c.json({ error: err.message }, err.status);
  throw err;
});
app.get("/protected", requireAuth, (c) => c.json({ userId: c.get("userId") }));
app.get("/admin", requireAuth, requireAdmin, (c) => c.json({ ok: true }));

async function get(path: string, cookie?: string) {
  const ctx = createExecutionContext();
  const res = await app.request(path, { headers: cookie ? { Cookie: cookie } : {} }, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

async function tokenFor(sub: unknown, { secret = env.JWT_SECRET, expiresIn = 3600 } = {}) {
  const iat = Math.floor(Date.now() / 1000);
  return sign({ sub, iat, exp: iat + expiresIn }, secret, "HS256");
}

async function makeUser(username: string, isAdmin = false) {
  const { userId } = await createUser(sql, {
    username,
    email: `${username}@example.com`,
    passwordHash: "hash",
  });
  if (isAdmin) await sql`UPDATE users SET is_admin = true WHERE id = ${userId}`;
  return userId;
}

beforeEach(async () => {
  await sql`TRUNCATE users`;
});

afterAll(async () => {
  await sql.end();
});

describe("requireAuth", () => {
  it("sets userId from a valid session cookie", async () => {
    const userId = await makeUser("alice");
    const res = await get("/protected", `session=${await tokenFor(userId)}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId });
  });

  it("returns 401 when there is no session cookie", async () => {
    const res = await get("/protected");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 for a garbage token", async () => {
    const res = await get("/protected", "session=not-a-real-token");

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 for a token signed with the wrong secret", async () => {
    const token = await tokenFor("some-id", { secret: "a-different-secret-entirely-32-chars!" });
    const res = await get("/protected", `session=${token}`);

    expect(res.status).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const token = await tokenFor("some-id", { expiresIn: -60 });
    const res = await get("/protected", `session=${token}`);

    expect(res.status).toBe(401);
  });

  it("returns 401 when the token has no string sub claim", async () => {
    const res = await get("/protected", `session=${await tokenFor(undefined)}`);

    expect(res.status).toBe(401);
  });
});

describe("requireAdmin", () => {
  it("lets an admin through", async () => {
    const userId = await makeUser("root", true);
    const res = await get("/admin", `session=${await tokenFor(userId)}`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 403 for a non-admin user", async () => {
    const userId = await makeUser("bob");
    const res = await get("/admin", `session=${await tokenFor(userId)}`);

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("returns 401 when the session user no longer exists", async () => {
    const token = await tokenFor("00000000-0000-0000-0000-000000000000");
    const res = await get("/admin", `session=${token}`);

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 401 without a session before any admin check runs", async () => {
    const res = await get("/admin");

    expect(res.status).toBe(401);
  });
});
