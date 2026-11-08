/**
 * Auth query tests — createUser and findUserByUsername against the test D1 database,
 * including how SQLite unique-constraint failures map to DuplicateFoundError.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createUser, findUserByUsername } from "../../features/auth/auth.queries";
import { AppError, DuplicateFoundError, UserNotFoundError } from "../../lib/errors";
import { db, clearUsers, countRows, failingDb, makeAdmin } from "../setup/db";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("auth sql queries", () => {
  const email = "test128@example.com";
  const username = "testName123";

  beforeEach(async () => {
    await clearUsers();
  });

  describe("createUser", () => {
    it("creates a user and returns a v4 uuid as the user id", async () => {
      const result = await createUser(db, { username: "test", email, passwordHash: "asjkdjaksjd" });

      expect(result.userId).toMatch(UUID_V4);
    });

    it("gives every user a distinct id", async () => {
      const first = await createUser(db, { username: "one", email: "one@example.com", passwordHash: "h" });
      const second = await createUser(db, { username: "two", email: "two@example.com", passwordHash: "h" });

      expect(first.userId).not.toBe(second.userId);
    });

    it("rejects an exact duplicate with DuplicateFoundError", async () => {
      const user = { username: "test", email, passwordHash: "asjkdjaksjd" };
      await createUser(db, user);

      await expect(createUser(db, user)).rejects.toThrow(DuplicateFoundError);
    });

    it("names the email when only the email is taken", async () => {
      await createUser(db, { username: "first", email, passwordHash: "h" });

      await expect(createUser(db, { username: "second", email, passwordHash: "h" })).rejects.toThrow(
        "An account with this email already exists",
      );
    });

    it("names the username when only the username is taken", async () => {
      await createUser(db, { username, email, passwordHash: "h" });

      await expect(
        createUser(db, { username, email: "other@example.com", passwordHash: "h" }),
      ).rejects.toThrow("An account with this username already exists");
    });

    it("does not insert a row when the insert is rejected", async () => {
      const user = { username: "test", email, passwordHash: "asjkdjaksjd" };
      await createUser(db, user);
      await createUser(db, user).catch(() => {});

      expect(await countRows()).toBe(1);
    });

    it("carries a 409 status on the duplicate error", async () => {
      const user = { username: "test", email, passwordHash: "asjkdjaksjd" };
      await createUser(db, user);

      const error = await createUser(db, user).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.status).toBe(409);
    });

    it("rethrows database errors that are not unique violations unchanged", async () => {
      const original = new Error("D1_ERROR: no such table: users");

      await expect(
        createUser(failingDb(original), { username, email, passwordHash: "h" }),
      ).rejects.toBe(original);
    });
  });

  describe("findUserByUsername", () => {
    it("finds user by username", async () => {
      await createUser(db, { username, email, passwordHash: "asjkdjaksjd" });

      const user = await findUserByUsername(db, username);

      expect(user.username).toBe(username);
    });

    it("returns the user id, stored password hash and isAdmin flag", async () => {
      const created = await createUser(db, { username, email, passwordHash: "stored-hash" });

      const user = await findUserByUsername(db, username);

      expect(user).toEqual({
        userId: created.userId,
        username,
        passwordHash: "stored-hash",
        isAdmin: false,
      });
    });

    it("returns isAdmin as the boolean true for an admin user", async () => {
      const { userId } = await createUser(db, { username, email, passwordHash: "stored-hash" });
      await makeAdmin(userId);

      const user = await findUserByUsername(db, username);

      expect(user.isAdmin).toBe(true);
    });

    it("throws UserNotFoundError when no user has that username", async () => {
      await expect(findUserByUsername(db, "nobodyHere")).rejects.toThrow(UserNotFoundError);
    });

    it("throws UserNotFoundError on an empty table", async () => {
      await expect(findUserByUsername(db, username)).rejects.toThrow("User not found");
    });

    it("matches usernames case-sensitively", async () => {
      await createUser(db, { username, email, passwordHash: "asjkdjaksjd" });

      await expect(findUserByUsername(db, username.toUpperCase())).rejects.toThrow(UserNotFoundError);
    });

    it("treats SQL metacharacters as literal data", async () => {
      await createUser(db, { username, email, passwordHash: "asjkdjaksjd" });

      await expect(findUserByUsername(db, "' OR '1'='1")).rejects.toThrow(UserNotFoundError);
    });

    it("rethrows database errors unchanged", async () => {
      const original = new Error("D1 unavailable");

      await expect(findUserByUsername(failingDb(original), username)).rejects.toBe(original);
    });
  });
});
