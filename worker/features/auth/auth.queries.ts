/**
 * Auth queries — SQL for creating and looking up users during signup/login.
 * Plain functions taking `sql` as the first argument; no classes.
 *
 */

import postgres, { Sql } from "postgres";
import { createUserProps } from "./auth.schemas";

export class DuplicateFoundError extends Error {
  constructor(message:string) {
    super(message);
    this.name='DuplicateFoundError'
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError'
  }
}

type createUserResponse = {
  userId: string;
  status: string;
}

type FindUserResponse = {
  userId: string;
  username: string;
  status: string;
  
}

async function createUser(sql: Sql, { username, email, passwordHash }: createUserProps): Promise<createUserResponse> {
  try {
    const [user] = await sql<{ id: string }[]>`
      INSERT INTO users (username, email, password_hash)
      VALUES (${username}, ${email}, ${passwordHash})
      RETURNING id
    `
    return {userId: user.id, status: 'ok'}
  } catch (err) {
    if (err instanceof postgres.PostgresError && err.code === '23505') {
      throw new DuplicateFoundError('email already exists');
    }
    throw err;
  }
}

async function findUserByUsername(sql: Sql, username: string) : Promise<FindUserResponse> {
  try {
    const [user] = await sql<{ id: string, username: string }[]>`SELECT id, name, email password_hash, is_admin, created_at, updated_at FROM users WHERE name = ${username}`
    console.log(user)
    return { userId: user.id, username: user.username, status: 'ok' }
  } catch (err) {
    console.log(err)
      throw err;
  }

}
export {createUser, findUserByUsername};
