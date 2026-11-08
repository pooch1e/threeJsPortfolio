/**
 * User query tests — findUserById, listUsers, countUsers, updateUser, deleteUser and
 * setPasswordHash against the test database.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:workers";
import { createUser } from "../../features/auth/auth.queries";
import {
  countUsers,
  deleteUser,
  findUserById,
  listUsers,
  setPasswordHash,
  updateUser,
} from "../../features/users/users.queries";
import { DuplicateFoundError, UserNotFoundError } from "../../lib/errors";
import { db, clearUsers, makeAdmin, storedPasswordHash, tick } from "../setup/db";

const MISSING_ID = "00000000-0000-0000-0000-000000000000";

describe("users sql queries", () => {

  async function makeUser(username: string) {
    const { userId } = await createUser(db, {
      username,
      email: `${username}@example.com`,
      passwordHash: "hash",
    });
    return userId;
  }

  beforeEach(async () => {
    await clearUsers();
  });

  describe("findUserById", () => {
    it("returns the user without the password hash", async () => {
      const userId = await makeUser("finder");

      const user = await findUserById(db, userId);

      expect(user).toMatchObject({
        userId,
        username: "finder",
        email: "finder@example.com",
        isAdmin: false,
      });
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user).not.toHaveProperty("passwordHash");
    });

    it("falls back to the username when no display name is set", async () => {
      const userId = await makeUser("nameless");

      expect((await findUserById(db, userId)).name).toBe("nameless");
    });

    it("reflects the admin flag", async () => {
      const userId = await makeUser("boss");
      await makeAdmin(userId);

      expect((await findUserById(db, userId)).isAdmin).toBe(true);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(findUserById(db, MISSING_ID)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("listUsers and countUsers", () => {
    it("returns newest users first", async () => {
      await makeUser("first");
      await tick();
      await makeUser("second");

      const users = await listUsers(db, 10, 0);

      expect(users.map((u) => u.username)).toEqual(["second", "first"]);
    });

    it("applies limit and offset", async () => {
      for (const name of ["a", "b", "c"]) {
        await makeUser(name);
        await tick();
      }

      const page = await listUsers(db, 1, 1);

      expect(page.map((u) => u.username)).toEqual(["b"]);
    });

    it("never includes the password hash", async () => {
      await makeUser("safe");

      const [user] = await listUsers(db, 10, 0);

      expect(user).not.toHaveProperty("passwordHash");
    });

    it("counts every user regardless of paging", async () => {
      await makeUser("one");
      await makeUser("two");

      expect(await countUsers(db)).toBe(2);
    });

    it("counts zero for an empty table", async () => {
      expect(await countUsers(db)).toBe(0);
    });
  });

  describe("updateUser", () => {
    it("updates only the provided fields", async () => {
      const userId = await makeUser("editme");

      const updated = await updateUser(db, userId, { name: "New Name" });

      expect(updated.name).toBe("New Name");
      expect(updated.email).toBe("editme@example.com");
      expect(updated.isAdmin).toBe(false);
    });

    it("treats null as unchanged", async () => {
      const userId = await makeUser("nulls");

      const updated = await updateUser(db, userId, { name: null, email: null, isAdmin: null });

      expect(updated.email).toBe("nulls@example.com");
      expect(updated.isAdmin).toBe(false);
    });

    it("can promote and demote an admin", async () => {
      const userId = await makeUser("promote");

      expect((await updateUser(db, userId, { isAdmin: true })).isAdmin).toBe(true);
      expect((await updateUser(db, userId, { isAdmin: false })).isAdmin).toBe(false);
    });

    it("bumps updatedAt", async () => {
      const userId = await makeUser("touched");
      const before = await findUserById(db, userId);
      await tick();

      const after = await updateUser(db, userId, { name: "Touched" });

      expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    });

    it("throws DuplicateFoundError when the email belongs to someone else", async () => {
      await makeUser("taken");
      const userId = await makeUser("other");

      await expect(
        updateUser(db, userId, { email: "taken@example.com" }),
      ).rejects.toThrow(DuplicateFoundError);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(updateUser(db, MISSING_ID, { name: "x" })).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("deleteUser", () => {
    it("removes the user", async () => {
      const userId = await makeUser("doomed");

      await deleteUser(db, userId);

      await expect(findUserById(db, userId)).rejects.toThrow(UserNotFoundError);
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(deleteUser(db, MISSING_ID)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("setPasswordHash", () => {
    it("stores the new hash", async () => {
      const userId = await makeUser("rehash");

      await setPasswordHash(db, userId, "new-hash");

      expect(await storedPasswordHash(userId)).toBe("new-hash");
    });

    it("throws UserNotFoundError for an unknown id", async () => {
      await expect(setPasswordHash(db, MISSING_ID, "x")).rejects.toThrow(UserNotFoundError);
    });
  });
});
