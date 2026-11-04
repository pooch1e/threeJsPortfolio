/**
 * Auth routes — POST /signup, /login, /logout. Handlers are  written inline
 */

type SignUpProps = {
  username: string;
  email: string;
  password: string;
}

import { Hono } from "hono";
import { Env } from "../../types";
import { hashPassword } from "../../lib/password";
const app = new Hono<Env>()

app.post('/signup', async (c) => {
  try {
    const { username, email, password }: SignUpProps = await c.req.json()
    // need to validate with zod schema from auth.schemas
    const passwordHash = await hashPassword(password);
    //1 insert into db
    //2 if db !== error
    return c.json({ ok: true }, 201);
    
  } catch (err) {
    console.log(err)
    // return error
  }

})