/**
 * Auth queries — SQL for creating and looking up users during signup/login.
 * Plain functions taking the D1 database as the first argument; no classes.
 */

import { createUserProps } from "./auth.schemas";
import { DuplicateFoundError, UserNotFoundError } from "../../lib/errors";
import { uniqueViolationColumn } from "../../lib/db";

type createUserResponse = {
  userId: string;
};

type FindUserResponse = {
  userId: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
};

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  is_admin: number;
};

const DUPLICATE_MESSAGES: Record<string, string> = {
  email: "An account with this email already exists",
  username: "An account with this username already exists",
};

async function createUser(
  db: D1Database,
  { username, email, passwordHash }: createUserProps,
): Promise<createUserResponse> {
  const userId = crypto.randomUUID();
  try {
    await db
      .prepare("INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)")
      .bind(userId, username, email, passwordHash)
      .run();
    return { userId };
  } catch (err) {
    const column = uniqueViolationColumn(err);
    if (column) {
      throw new DuplicateFoundError(DUPLICATE_MESSAGES[column]);
    }
    throw err;
  }
}

async function findUserByUsername(db: D1Database, username: string): Promise<FindUserResponse> {
  const user = await db
    .prepare("SELECT id, username, password_hash, is_admin FROM users WHERE username = ?")
    .bind(username)
    .first<UserRow>();
  if (!user) {
    throw new UserNotFoundError();
  }
  return {
    userId: user.id,
    username: user.username,
    passwordHash: user.password_hash,
    isAdmin: user.is_admin === 1,
  };
}

export { createUser, findUserByUsername };
