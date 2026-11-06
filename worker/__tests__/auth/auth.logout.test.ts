/**
 * Logout route tests — exercises POST /auth/logout through the full Hono app. The session cookie is overwritten with an expired
 * one carrying the same Path/Secure/SameSite flags login used, so browsers actually drop it.
 */
import { describe, it, expect } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import app from "../../index";

async function postLogout(testEnv: object = env, headers: Record<string, string> = {}) {
  const ctx = createExecutionContext();
  const res = await app.request("/auth/logout", { method: "POST", headers }, testEnv, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

function sessionCookie(res: Response) {
  return res.headers.getSetCookie().find((cookie) => cookie.startsWith("session="));
}

describe("POST /auth/logout", () => {
  it("returns 200 with a logged out message", async () => {
    const res = await postLogout();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ message: "logged out" });
  });

  it("overwrites the session cookie with an empty value", async () => {
    const cookie = sessionCookie(await postLogout());

    expect(cookie).toMatch(/^session=;/);
  });

  it("expires the cookie immediately with Max-Age=0", async () => {
    const cookie = sessionCookie(await postLogout());

    expect(cookie).toMatch(/;\s*Max-Age=0/i);
  });

  it("scopes the cookie to / so it matches the one login set", async () => {
    const cookie = sessionCookie(await postLogout());

    expect(cookie).toMatch(/;\s*Path=\//i);
  });

  it("uses SameSite=Lax and no Secure flag outside production", async () => {
    const cookie = sessionCookie(await postLogout());

    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
    expect(cookie).not.toMatch(/;\s*Secure/i);
  });

  it("uses SameSite=None and Secure in production so the browser accepts the clearing cookie", async () => {
    const cookie = sessionCookie(await postLogout({ ...env, APP_ENV: "production" }));

    expect(cookie).toMatch(/;\s*SameSite=None/i);
    expect(cookie).toMatch(/;\s*Secure/i);
  });

  it("works without a session so an expired login can still clear its cookie", async () => {
    const res = await postLogout();

    expect(res.status).toBe(200);
  });

  it("works when the request carries a stale or garbage session cookie", async () => {
    const res = await postLogout(env, { Cookie: "session=not-a-real-token" });

    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toMatch(/^session=;/);
  });
});
