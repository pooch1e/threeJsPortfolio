/**
 * Auth queries — SQL for creating and looking up users during signup/login.
 * Plain functions taking `sql` as the first argument; no classes.
 *
 * Define:
 *  - createUser(sql, { username, email, passwordHash })
 *  - findUserByEmail(sql, email)
 */

import postgres, { Sql } from "postgres";
import { createUserProps } from "./auth.schemas";

export class DuplicateFoundError extends Error {
  constructor(message:string) {
    super(message);
    this.name='DuplicateFoundError'
  }
}

type userResponse = {
  userId: string;
  status: string;
}

async function createUser(sql: Sql, { username, email, passwordHash }: createUserProps): Promise<userResponse> {
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
export {createUser};
