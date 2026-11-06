/**
 * requireAuth — reads the `session` cookie, verifies the JWT, and sets
 * c.var.userId. Responds 401 `{ error }` when missing or invalid.
 */
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import { AppError } from "../lib/errors";
import type { Env } from "../types";

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, "session");
  if (!token) throw new AppError("Unauthorized", 401);

  const payload = await verify(token, c.env.JWT_SECRET, "HS256").catch(() => {
    throw new AppError("Unauthorized", 401);
  });

  if (typeof payload.sub !== "string") throw new AppError("Unauthorized", 401);

  c.set("userId", payload.sub);
  await next();
});
