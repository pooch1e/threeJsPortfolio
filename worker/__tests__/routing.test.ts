/**
 * Routing tests — checks which /api routes are public, which need a session, and which
 * need an admin, using the real app from index.ts.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { sign } from "hono/jwt";
import postgres from "postgres";
import app from "../index";
import { createUser } from "../features/auth/auth.queries";

const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1, transform: postgres.camel });

async function request(path: string, init: RequestInit = {}, cookie?: string) {
  const ctx = createExecutionContext();
  const headers = { ...(init.headers as Record<string, string>), ...(cookie ? { Cookie: cookie } : {}) };
  const res = await app.request(path, { ...init, headers }, env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

async function sessionFor(username: string, isAdmin = false) {
  const { userId } = await createUser(sql, { username, email: `${username}@example.com`, passwordHash: "hash" });
  if (isAdmin) await sql`UPDATE users SET is_admin = true WHERE id = ${userId}`;
  const iat = Math.floor(Date.now() / 1000);
  return `session=${await sign({ sub: userId, iat, exp: iat + 3600 }, env.JWT_SECRET, "HS256")}`;
}

beforeEach(async () => {
  await sql`TRUNCATE users`;
});

afterAll(async () => {
  await sql.end();
});

describe("public routes", () => {
  it("serves /health without a session", async () => {
    expect((await request("/health")).status).toBe(200);
  });

  it.each(["/api/signup", "/api/login"])("does not demand a session for POST %s", async (path) => {
    const res = await request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    expect(res.status).toBe(400);
  });

  it("does not demand a session for POST /api/logout", async () => {
    expect((await request("/api/logout", { method: "POST" })).status).toBe(200);
  });
});

describe("protected routes", () => {
  it("rejects /api/me without a session", async () => {
    const res = await request("/api/me");
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("lets a valid session past requireAuth", async () => {
    const res = await request("/api/me", {}, await sessionFor("alice"));
    expect(res.status).not.toBe(401);
  });
});

describe("admin routes", () => {
  it("rejects /api/admin/* without a session", async () => {
    expect((await request("/api/admin/users")).status).toBe(401);
  });

  it("rejects a non-admin session with 403", async () => {
    const res = await request("/api/admin/users", {}, await sessionFor("bob"));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
  });

  it("lets an admin session past requireAdmin", async () => {
    const res = await request("/api/admin/users", {}, await sessionFor("root", true));
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });
});
