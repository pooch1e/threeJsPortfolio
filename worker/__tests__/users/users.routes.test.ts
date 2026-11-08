/**
 * User route tests — GET /api/me and the /api/admin/users endpoints through the full app
 * against the test database. Checks the camelCase response shapes the frontend reads,
 * the error codes, and that every admin endpoint is closed to non-admins.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { sign } from "hono/jwt";
import app from "../../index";
import { createUser } from "../../features/auth/auth.queries";
import { db, clearUsers, makeAdmin, deleteUserRow, storedPasswordHash } from "../setup/db";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";
const STRONG_PASSWORD = "NewPass1@";

async function call(method: string, path: string, cookie?: string, body?: unknown) {
  const ctx = createExecutionContext();
  const headers: Record<string, string> = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await app.request(
    path,
    { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
}

async function makeUser(username: string, isAdmin = false) {
  const { userId } = await createUser(db, {
    username,
    email: `${username}@example.com`,
    passwordHash: "hash",
  });
  if (isAdmin) await makeAdmin(userId);
  const iat = Math.floor(Date.now() / 1000);
  const token = await sign({ sub: userId, iat, exp: iat + 3600 }, env.JWT_SECRET, "HS256");
  return { userId, cookie: `session=${token}` };
}

beforeEach(async () => {
  await clearUsers();
});

describe("GET /api/me", () => {
  it("returns the session user with a camelCase admin flag", async () => {
    const { userId, cookie } = await makeUser("alice");

    const res = await call("GET", "/api/me", cookie);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: userId, username: "alice", isAdmin: false });
  });

  it("reports an admin as isAdmin true", async () => {
    const { cookie } = await makeUser("root", true);

    const body = (await (await call("GET", "/api/me", cookie)).json()) as { isAdmin: boolean };

    expect(body.isAdmin).toBe(true);
  });

  it("never leaks the password hash or email", async () => {
    const { cookie } = await makeUser("private");

    const text = await (await call("GET", "/api/me", cookie)).text();

    expect(text).not.toMatch(/password|hash|@example\.com/i);
  });

  it("returns 404 when the session user has been deleted", async () => {
    const { userId, cookie } = await makeUser("ghost");
    await deleteUserRow(userId);

    const res = await call("GET", "/api/me", cookie);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "User not found" });
  });

  it("returns 401 without a session", async () => {
    expect((await call("GET", "/api/me")).status).toBe(401);
  });
});

describe("admin endpoints require an admin", () => {
  it.each([
    ["GET", "/api/admin/users", undefined],
    ["GET", `/api/admin/users/${MISSING_ID}`, undefined],
    ["PUT", `/api/admin/users/${MISSING_ID}`, { name: "x" }],
    ["DELETE", `/api/admin/users/${MISSING_ID}`, undefined],
    ["POST", `/api/admin/users/${MISSING_ID}/passwordReset`, { password: STRONG_PASSWORD }],
  ])("%s %s returns 403 for a non-admin and 401 without a session", async (method, path, body) => {
    const { cookie } = await makeUser("regular");

    const forbidden = await call(method, path, cookie, body);
    const unauthenticated = await call(method, path, undefined, body);

    expect(forbidden.status).toBe(403);
    expect(unauthenticated.status).toBe(401);
  });
});

describe("GET /api/admin/users", () => {
  it("returns users and pagination meta", async () => {
    const { cookie } = await makeUser("root", true);
    await makeUser("bob");

    const res = await call("GET", "/api/admin/users", cookie);
    const body = (await res.json()) as { users: Record<string, unknown>[]; pagination: unknown };

    expect(res.status).toBe(200);
    expect(body.users).toHaveLength(2);
    expect(body.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  it("serialises users in camelCase without the password hash", async () => {
    const { cookie } = await makeUser("root", true);

    const { users } = (await (await call("GET", "/api/admin/users", cookie)).json()) as {
      users: Record<string, unknown>[];
    };

    expect(Object.keys(users[0]).sort()).toEqual(
      ["createdAt", "email", "id", "isAdmin", "name", "updatedAt", "username"].sort(),
    );
  });

  it("paginates with page and limit", async () => {
    const { cookie } = await makeUser("root", true);
    for (const name of ["a", "b", "c", "d"]) await makeUser(name);

    const res = await call("GET", "/api/admin/users?page=2&limit=2", cookie);
    const body = (await res.json()) as {
      users: unknown[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };

    expect(body.users).toHaveLength(2);
    expect(body.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
  });

  it("returns an empty list past the last page", async () => {
    const { cookie } = await makeUser("root", true);

    const body = (await (await call("GET", "/api/admin/users?page=9", cookie)).json()) as {
      users: unknown[];
    };

    expect(body.users).toEqual([]);
  });

  it.each([
    ["page=0&limit=0", 1, 20],
    ["page=abc&limit=xyz", 1, 20],
    ["page=-3&limit=-1", 1, 20],
    ["limit=1000", 1, 100],
  ])("falls back to sane paging for ?%s", async (query, page, limit) => {
    const { cookie } = await makeUser("root", true);

    const body = (await (await call("GET", `/api/admin/users?${query}`, cookie)).json()) as {
      pagination: { page: number; limit: number };
    };

    expect(body.pagination.page).toBe(page);
    expect(body.pagination.limit).toBe(limit);
  });
});

describe("GET /api/admin/users/:id", () => {
  it("returns the user", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("GET", `/api/admin/users/${target.userId}`, cookie);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      id: target.userId,
      username: "target",
      email: "target@example.com",
      isAdmin: false,
    });
    expect(JSON.stringify(body)).not.toMatch(/password/i);
  });

  it("returns 404 for an unknown id", async () => {
    const { cookie } = await makeUser("root", true);

    const res = await call("GET", `/api/admin/users/${MISSING_ID}`, cookie);

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "User not found" });
  });

  it("returns 400 for an id that is not a uuid", async () => {
    const { cookie } = await makeUser("root", true);

    const res = await call("GET", "/api/admin/users/not-a-uuid", cookie);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Id must be a valid uuid" });
  });
});

describe("PUT /api/admin/users/:id", () => {
  it("updates name, email and the admin flag", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("PUT", `/api/admin/users/${target.userId}`, cookie, {
      name: "Renamed",
      email: "renamed@example.com",
      isAdmin: true,
    });
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ name: "Renamed", email: "renamed@example.com", isAdmin: true });
  });

  it("persists the change", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    await call("PUT", `/api/admin/users/${target.userId}`, cookie, { name: "Saved" });
    const body = (await (await call("GET", `/api/admin/users/${target.userId}`, cookie)).json()) as {
      name: string;
    };

    expect(body.name).toBe("Saved");
  });

  it("leaves omitted fields unchanged", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const body = (await (
      await call("PUT", `/api/admin/users/${target.userId}`, cookie, { name: "Only Name" })
    ).json()) as Record<string, unknown>;

    expect(body).toMatchObject({ email: "target@example.com", isAdmin: false });
  });

  it("returns 409 when the email belongs to someone else", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("PUT", `/api/admin/users/${target.userId}`, cookie, {
      email: "root@example.com",
    });

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "An account with this email already exists" });
  });

  it("returns 404 for an unknown id", async () => {
    const { cookie } = await makeUser("root", true);

    const res = await call("PUT", `/api/admin/users/${MISSING_ID}`, cookie, { name: "x" });

    expect(res.status).toBe(404);
  });

  it.each([
    ["an invalid email", { email: "nope" }],
    ["an empty name", { name: "" }],
    ["a non-boolean isAdmin", { isAdmin: "yes" }],
  ])("returns 400 for %s", async (_label, body) => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("PUT", `/api/admin/users/${target.userId}`, cookie, body);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: expect.any(String) });
  });
});

describe("DELETE /api/admin/users/:id", () => {
  it("deletes the user", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("DELETE", `/api/admin/users/${target.userId}`, cookie);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Successfully deleted user" });
    expect((await call("GET", `/api/admin/users/${target.userId}`, cookie)).status).toBe(404);
  });

  it("returns 404 for an unknown id", async () => {
    const { cookie } = await makeUser("root", true);

    expect((await call("DELETE", `/api/admin/users/${MISSING_ID}`, cookie)).status).toBe(404);
  });

  it("returns 400 for an id that is not a uuid", async () => {
    const { cookie } = await makeUser("root", true);

    expect((await call("DELETE", "/api/admin/users/nope", cookie)).status).toBe(400);
  });
});

describe("POST /api/admin/users/:id/passwordReset", () => {
  it("replaces the password with a hash, never the plaintext", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("POST", `/api/admin/users/${target.userId}/passwordReset`, cookie, {
      password: STRONG_PASSWORD,
    });
    const passwordHash = await storedPasswordHash(target.userId);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "Successfully updated password" });
    expect(passwordHash).not.toBe("hash");
    expect(passwordHash).not.toBe(STRONG_PASSWORD);
  });

  it("lets the user log in with the new password", async () => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");
    await call("POST", `/api/admin/users/${target.userId}/passwordReset`, cookie, {
      password: STRONG_PASSWORD,
    });

    const login = await call("POST", "/api/login", undefined, {
      username: "target",
      password: STRONG_PASSWORD,
    });

    expect(login.status).toBe(200);
  });

  it.each([
    ["too short", "Ab1@", "Password must be at least 8 characters"],
    ["no lowercase", "ABCDEFG1@", "Password must contain a lowercase letter"],
    ["no uppercase", "abcdefg1@", "Password must contain an uppercase letter"],
    ["no number", "Abcdefgh@", "Password must contain a number"],
    ["no special character", "Abcdefg12", "Password must contain a special character (@$!%*?&)"],
  ])("returns 400 for a password with %s", async (_label, password, message) => {
    const { cookie } = await makeUser("root", true);
    const target = await makeUser("target");

    const res = await call("POST", `/api/admin/users/${target.userId}/passwordReset`, cookie, {
      password,
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: message });
  });

  it("returns 404 for an unknown id", async () => {
    const { cookie } = await makeUser("root", true);

    const res = await call("POST", `/api/admin/users/${MISSING_ID}/passwordReset`, cookie, {
      password: STRONG_PASSWORD,
    });

    expect(res.status).toBe(404);
  });
});
