/**
 * User schemas (zod) — id param, pagination query, admin update body, password reset body.
 * Password rules match the Go server's ValidatePasswordRules.
 */
import { z } from "zod";

const userIdParamSchema = z.object({
  id: z.uuid({ message: "Id must be a valid uuid" }),
});

const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(50).nullish(),
  email: z.email().max(57).nullish(),
  isAdmin: z.boolean().nullish(),
});

const passwordResetSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/\d/, "Password must contain a number")
    .regex(/[@$!%*?&]/, "Password must contain a special character (@$!%*?&)")
    .max(57),
});

type UpdateUserBody = z.infer<typeof updateUserSchema>;

export { userIdParamSchema, listUsersQuerySchema, updateUserSchema, passwordResetSchema };
export type { UpdateUserBody };
