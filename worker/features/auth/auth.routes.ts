/**
 * Auth routes — POST /signup, /login, /logout. Handlers are written inline
 * (not extracted) so Hono keeps request and param types.
 * Ports server/internal/handlers/{signup,login,logout}.go.
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
    //insert into db
    return c.json({ ok: true }, 201);
    
  } catch (err) {
    console.log(err)
    // return error
  }

})