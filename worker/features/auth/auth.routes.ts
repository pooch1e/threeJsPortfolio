/**
 * Auth routes — POST /signup, /login, /logout. Handlers are  written inline
 */

import { Hono } from "hono";
import { Env } from "../../types";
import { comparePassword, hashPassword } from "../../lib/password";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, signUpSchema } from "./auth.schemas";
import { createUser, DuplicateFoundError, UserNotFoundError } from "./auth.queries";
import { findUserByUsername } from "./auth.queries";

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
    // check user exists with username
    const user = await findUserByUsername(sql, username);
    if (user.status !== 'ok') {
      return c.json({ error: 'error logging in' }, 400);
    }
    // check password
    const isPasswordCorrect = await comparePassword(password, user.passwordHash);
    if (isPasswordCorrect !== true) {
      return c.json({ error: 'incorrect password' }, 400);
    }

    // return signed cookie etc
    if (user && user !== null && user !== undefined && user.status === 'ok') {
      return c.json({ ok: true }, 200);
    }
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return c.json({ error: err.message }, 400);
    }
    return c.json({ error: 'internal server error'}, 500);
  }
})

export default app;
