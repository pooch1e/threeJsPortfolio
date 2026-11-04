/**
 * Auth routes — POST /signup, /login, /logout. Handlers are  written inline
 */

import { Hono } from "hono";
import { Env } from "../../types";
import { hashPassword } from "../../lib/password";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { signUpSchema, type SignUpProps } from "./auth.schemas";
const app = new Hono<Env>();

app.post("/signup", zValidator("json", signUpSchema), async (c) => {
  const { username, email, password }: SignUpProps = await c.req.json();
  
  try {
    const passwordHash = await hashPassword(password);
    //1 insert into db
    //2 if db !== error
    return c.json({ ok: true }, 201);
  } catch (err) {
    console.log(err);
    // return error
  }
});

export default app;
