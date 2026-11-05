/**
 * Auth routes — POST /signup, /login, /logout. Handlers are  written inline
 */

import { Hono } from "hono";
import { Env } from "../../types";
import { hashPassword } from "../../lib/password";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, signUpSchema } from "./auth.schemas";
import { createUser, DuplicateFoundError } from "./auth.queries";

const app = new Hono<Env>();

app.post("/signup", zValidator("json", signUpSchema), async (c) => {
  const { username, email, password } = c.req.valid("json");
  const sql = c.get("db");

  try {
    const passwordHash = await hashPassword(password);
    const insertedUser = await createUser(sql, { username, email, passwordHash });

    if (insertedUser.status !== "ok") {
      return c.json({ error: "error creating user" }, 500);
    }

    return c.json({ ok: true }, 201);
  } catch (err) {
    if (err instanceof DuplicateFoundError) {
      return c.json({ error: err.message }, 409);
    }
    console.error(err);
    return c.json({ error: "internal server error" }, 500);
  }
});

app.post('/login', zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const sql = c.get('db');

  try {
    // const user = findUserByUsername(sql, username);
  } catch (err) {
    
  }
})

export default app;
