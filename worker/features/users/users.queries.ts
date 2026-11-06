/**
 * User queries — SQL for reading and administering users.
 * Plain functions taking `sql` as the first argument.
 *
 * Define:
 *  - findUserById(sql, id)
 *  - listUsers(sql)
 *  - updateUser(sql, id, fields)
 *  - deleteUser(sql, id)
 *  - setPasswordHash(sql, id, passwordHash)
 */
import type { Sql } from "postgres";
import { UserNotFoundError } from "../../lib/errors";

type UserRow = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
};

type FindUserByIdResponse = {
  userId: string;
  username: string;
  email: string;
  isAdmin: boolean;
};

async function findUserById(sql: Sql, id: string): Promise<FindUserByIdResponse> {
  const [user] = await sql<UserRow[]>`
    SELECT id, username, email, is_admin FROM users WHERE id = ${id}
  `;
  if (!user) {
    throw new UserNotFoundError();
  }
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
  };
}

export { findUserById };
export type { FindUserByIdResponse };
