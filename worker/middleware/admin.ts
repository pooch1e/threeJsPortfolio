/**
 * requireAdmin — loads the current user by c.var.userId and responds 403
 * `{ error }` unless they are an admin. Must run after requireAuth.
 */
import { createMiddleware } from "hono/factory";
import { AppError, UserNotFoundError } from "../lib/errors";
import { findUserById } from "../features/users/users.queries";
import type { Env } from "../types";

export const requireAdmin = createMiddleware<Env>(async (c, next) => {
  const user = await findUserById(c.get("db"), c.get("userId")).catch((err) => {
    throw err instanceof UserNotFoundError ? new AppError("Unauthorized", 401) : err;
  });

  if (!user.isAdmin) throw new AppError("Forbidden", 403);

  await next();
});
