/**
 * Request validation helper — zValidator wrapper that turns the first zod issue into
 * the app's `{ error }` 400 response instead of zod's default error payload, so the
 * frontend's apiClient can show the message directly.
 */
import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import type { ValidationTargets } from "hono";
import { AppError } from "./errors";

export function validate<T extends ZodType, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T,
) {
  return zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new AppError(result.error.issues[0]?.message ?? "Invalid input", 400);
    }
  });
}
