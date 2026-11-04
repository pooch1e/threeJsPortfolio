/**
 * Auth request schemas (zod) — signup and login bodies.
 */

import { z } from "zod";

// Sign up request
const signUpSchema = z.object({
  email: z.email().min(5).max(57),
  username: z.string().min(1).max(20),
  password: z.string().min(8).max(57),
});

export type SignUpProps = z.infer<typeof signUpSchema>;

// Create User schema
const createUserSchema = z.object({
  username: z.string().min(1).max(50),
  email: z.string().min(1).max(57),
  passwordHash: z.string().min(1).max(57),
});

export type createUserProps = z.infer<typeof createUserSchema>;

const loginSchema = z.object({
  email: z.email().min(5).max(57),
  username: z.string().min(1).max(20),
  password: z.string().min(1).max(57),
});

export { signUpSchema, loginSchema };
