/**
 * Auth queries — SQL for creating and looking up users during signup/login.
 * Plain functions taking `sql` as the first argument; no classes.
 *
 * Define:
 *  - createUser(sql, { username, email, passwordHash })
 *  - findUserByEmail(sql, email)
 */

import { Sql } from "postgres";
import { createUserProps, SignUpProps } from "./auth.schemas";

function createUser(sql :Sql, { username, email, passwordHash } : createUserProps) : string {
  return 'test'
}
export {};
