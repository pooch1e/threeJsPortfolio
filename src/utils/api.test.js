import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "./api";

function makeFetchResponse({
  status = 200,
  ok = true,
  json = null,
  text = "",
}) {
  return {
    status,
    ok,
    json: () =>
      json !== null
        ? Promise.resolve(json)
        : Promise.reject(new SyntaxError("no json")),
    text: () => Promise.resolve(text),
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("apiClient", () => {
  it("returns parsed JSON on success", async () => {
    globalThis.fetch.mockResolvedValue(
      makeFetchResponse({ json: { name: "alice" } }),
    );
    const result = await apiClient("/api/me");
    expect(result).toEqual({ name: "alice" });
  });

  it("returns null for 204 No Content", async () => {
    globalThis.fetch.mockResolvedValue(
      makeFetchResponse({ status: 204, ok: true, json: null }),
    );
    const result = await apiClient("/api/logout", { method: "POST" });
    expect(result).toBeNull();
  });

  it("throws with server error message when body has error field", async () => {
    globalThis.fetch.mockResolvedValue(
      makeFetchResponse({
        status: 401,
        ok: false,
        json: { error: "invalid credentials" },
      }),
    );
    await expect(
      apiClient("/api/login", { method: "POST", body: "{}" }),
    ).rejects.toThrow("invalid credentials");
  });

  it("throws with HTTP status fallback when error body is not JSON", async () => {
    globalThis.fetch.mockResolvedValue(
      makeFetchResponse({ status: 500, ok: false, json: null }),
    );
    await expect(
      apiClient("/api/login", { method: "POST", body: "{}" }),
    ).rejects.toThrow("HTTP error! status: 500");
  });

  it("always sends credentials: include", async () => {
    globalThis.fetch.mockResolvedValue(makeFetchResponse({ json: {} }));
    await apiClient("/api/me");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("always sets Content-Type to application/json", async () => {
    globalThis.fetch.mockResolvedValue(makeFetchResponse({ json: {} }));
    await apiClient("/api/me");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("merges caller-provided headers with defaults", async () => {
    globalThis.fetch.mockResolvedValue(makeFetchResponse({ json: {} }));
    await apiClient("/api/me", { headers: { "X-Custom": "value" } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Custom": "value",
        }),
      }),
    );
  });
});
