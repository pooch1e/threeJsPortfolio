/**
 * Error handling tests — the shared error types and the app.onError mapping in index.ts.
 */
import { describe, it, expect } from "vitest";
import { createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import { env } from "cloudflare:workers";
import app from "../index";
import {
  AppError,
  DuplicateFoundError,
  InvalidCredentialsError,
  UserNotFoundError,
} from "../lib/errors";

describe("shared errors", () => {
  it.each([
    [new UserNotFoundError(), 404, "UserNotFoundError", "User not found"],
    [new DuplicateFoundError("An account with this email already exists"), 409, "DuplicateFoundError", "An account with this email already exists"],
    [new InvalidCredentialsError(), 401, "InvalidCredentialsError", "Invalid credentials"],
  ])("%o carries status %i, name %s and message %s", (error, status, name, message) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(status);
    expect(error.name).toBe(name);
    expect(error.message).toBe(message);
  });

  it("keeps the original error as the cause", () => {
    const cause = new Error("root");

    expect(new AppError("wrapped", 500, { cause }).cause).toBe(cause);
  });
});

describe("app.onError", () => {
  it("passes through the 401 from the jwt middleware instead of turning it into a 500", async () => {
    const ctx = createExecutionContext();

    const res = await app.request("/admin/anything", {}, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(401);
  });
});
