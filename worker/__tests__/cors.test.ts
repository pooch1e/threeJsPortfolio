/**
 * CORS tests — the API answers cross-origin requests only from the exact FRONTEND_URL
 * origin, with credentials allowed so the browser sends and stores the session cookie.
 */
import { describe, it, expect } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import app from "../index";

const PRODUCTION_ORIGIN = "https://arczpng.com";

async function request(path: string, init: RequestInit = {}, testEnv: object = env) {
  const ctx = createExecutionContext();
  const res = await app.request(path, init, testEnv, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

function preflight(path: string, origin: string, testEnv: object = env) {
  return request(
    path,
    {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    },
    testEnv,
  );
}

describe("CORS", () => {
  it("allows the FRONTEND_URL origin with credentials", async () => {
    const res = await request("/health", { headers: { Origin: env.FRONTEND_URL } });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(env.FRONTEND_URL);
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("never answers with a wildcard origin", async () => {
    const res = await request("/health", { headers: { Origin: env.FRONTEND_URL } });

    expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
  });

  it.each([
    ["an unrelated site", "https://evil.example"],
    ["a lookalike subdomain", "https://arczpng.com.evil.example"],
    ["the right host on the wrong scheme", "http://arczpng.com"],
    ["the www host when FRONTEND_URL is the apex", "https://www.arczpng.com"],
  ])("gives no allow-origin header to %s", async (_label, origin) => {
    const res = await request("/health", { headers: { Origin: origin } }, {
      ...env,
      FRONTEND_URL: PRODUCTION_ORIGIN,
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("answers a preflight from the allowed origin", async () => {
    const res = await preflight("/api/login", env.FRONTEND_URL);

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(env.FRONTEND_URL);
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Headers")?.toLowerCase()).toContain("content-type");
  });

  it("gives a preflight from another origin no allow-origin header", async () => {
    const res = await preflight("/api/login", "https://evil.example");

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("follows FRONTEND_URL, so production allows arczpng.com and not localhost", async () => {
    const productionEnv = { ...env, FRONTEND_URL: PRODUCTION_ORIGIN };

    const fromSite = await request("/health", { headers: { Origin: PRODUCTION_ORIGIN } }, productionEnv);
    const fromLocalhost = await request(
      "/health",
      { headers: { Origin: "http://localhost:5173" } },
      productionEnv,
    );

    expect(fromSite.headers.get("Access-Control-Allow-Origin")).toBe(PRODUCTION_ORIGIN);
    expect(fromLocalhost.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("still serves requests that carry no Origin, such as curl and health checks", async () => {
    const res = await request("/health");

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
