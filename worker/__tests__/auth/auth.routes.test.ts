/**
 * Signup route tests — exercises POST /signup through the full Hono app
 * against the test database.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import postgres from "postgres";
import app from "../../index";

const validBody = { username: "test", email: "test@example.com", password: "password123" };

async function postSignup(body: unknown, testEnv = env) {
  const ctx = createExecutionContext();
  const res = await app.request(
    "/api/signup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    testEnv,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
}

describe("POST /api/signup", () => {
  const sql = postgres(env.HYPERDRIVE.connectionString, { max: 1 });

  beforeEach(async () => {
    await sql`TRUNCATE users`;
  });
  afterAll(async () => {
    await sql.end();
  });

  it("returns 201 and stores the user on success", async () => {
    const res = await postSignup(validBody);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    const rows = await sql`SELECT email FROM users`;
    expect(rows).toHaveLength(1);
  });

  it("never stores the plaintext password", async () => {
    await postSignup(validBody);
    const [row] = await sql`SELECT password_hash FROM users`;
    expect(row.password_hash).not.toBe(validBody.password);
  });

  it("returns 409 for a duplicate email", async () => {
    await postSignup(validBody);
    const res = await postSignup(validBody);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "An account with this email already exists" });
  });

  it.each([
    ["short password", { ...validBody, password: "short" }],
    ["invalid email", { ...validBody, email: "nope" }],
    ["missing username", { email: validBody.email, password: validBody.password }],
  ])("returns 400 for %s", async (_name, body) => {
    const res = await postSignup(body);
    expect(res.status).toBe(400);
  });

  it("returns 500 when the database is unreachable", async () => {
    const brokenEnv = {
      ...env,
      HYPERDRIVE: { connectionString: "postgres://nobody:nope@127.0.0.1:1/none" } as Hyperdrive,
    };
    const res = await postSignup(validBody, brokenEnv);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});
