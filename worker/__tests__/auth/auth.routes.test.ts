/**
 * Signup route tests — exercises POST /signup through the full Hono app
 * against the test database.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import app from "../../index";
import { clearUsers, storedPasswordHashes, countRows, failingDb } from "../setup/db";

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

  beforeEach(async () => {
    await clearUsers();
  });

  it("returns 201 and stores the user on success", async () => {
    const res = await postSignup(validBody);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(await countRows()).toBe(1);
  });

  it("never stores the plaintext password", async () => {
    await postSignup(validBody);
    const [passwordHash] = await storedPasswordHashes();
    expect(passwordHash).not.toBe(validBody.password);
  });

  it("returns 409 for a duplicate email", async () => {
    await postSignup(validBody);
    const res = await postSignup(validBody);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "An account with this email already exists" });
  });

  it("returns 409 naming the email when only the email is taken", async () => {
    await postSignup(validBody);
    const res = await postSignup({ ...validBody, username: "someoneElse" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "An account with this email already exists" });
  });

  it("returns 409 naming the username when only the username is taken", async () => {
    await postSignup(validBody);
    const res = await postSignup({ ...validBody, email: "different@example.com" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "An account with this username already exists" });
    expect(await countRows()).toBe(1);
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
      DB: failingDb(),
    };
    const res = await postSignup(validBody, brokenEnv);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});
