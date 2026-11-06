/**
 * Auth routes — POST /signup, /login, /logout. Handlers are  written inline
 */

import { Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../types";
import { comparePassword, hashPassword } from "../../lib/password";
import { InvalidCredentialsError, UserNotFoundError } from "../../lib/errors";
import { loginSchema, signUpSchema } from "./auth.schemas";
import { createUser, findUserByUsername } from "./auth.queries";

const SESSION_SECONDS = 60 * 60;

const app = new Hono<Env>();

app.post("/signup", zValidator("json", signUpSchema), async (c) => {
  const { username, email, password } = c.req.valid("json");

  const passwordHash = await hashPassword(password);
  await createUser(c.get("db"), { username, email, passwordHash });

  return c.json({ ok: true }, 201);
});

app.post("/login", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  const user = await findUserByUsername(c.get("db"), username).catch((err) => {
    throw err instanceof UserNotFoundError ? new InvalidCredentialsError() : err;
  });

  if (!(await comparePassword(password, user.passwordHash))) {
    throw new InvalidCredentialsError();
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const token = await sign(
    { sub: user.userId, iat: issuedAt, exp: issuedAt + SESSION_SECONDS },
    c.env.JWT_SECRET,
    "HS256",
  );

  const isProduction = c.env.APP_ENV === "production";
  setCookie(c, "session", token, {
    httpOnly: true,
    path: "/",
    maxAge: SESSION_SECONDS,
    sameSite: isProduction ? "None" : "Lax",
    secure: isProduction,
  });

  return c.json({ id: user.userId, username: user.username, isAdmin: user.isAdmin }, 200);
});

export default app;
