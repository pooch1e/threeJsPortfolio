/**
 * Auth queries — SQL for creating and looking up users during signup/login.
 * Plain functions taking `sql` as the first argument; no classes.
 *
 */

import postgres, { Sql } from "postgres";
import { createUserProps } from "./auth.schemas";
import { DuplicateFoundError, UserNotFoundError } from "../../lib/errors";

type createUserResponse = {
  userId: string;
}

type FindUserResponse = {
  userId: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
}

type UserRow = {
  id: string;
  username: string;
  passwordHash: string;
  isAdmin: boolean;
}

async function createUser(sql: Sql, { username, email, passwordHash }: createUserProps): Promise<createUserResponse> {
  try {
    const [user] = await sql<{ id: string }[]>`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id
    `
    return { userId: user.id }
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === '23505') {
      throw new DuplicateFoundError('An account with this email already exists');
    }
    throw err;
  }
}

async function findUserByUsername(sql: Sql, username: string): Promise<FindUserResponse> {
  const [user] = await sql<UserRow[]>`SELECT id, username, password_hash, is_admin FROM users WHERE username = ${username}`;
  if (!user) {
    throw new UserNotFoundError();
  }
  return {
    userId: user.id,
    username: user.username,
    passwordHash: user.passwordHash,
    isAdmin: user.isAdmin,
  };
}

export { createUser, findUserByUsername };
