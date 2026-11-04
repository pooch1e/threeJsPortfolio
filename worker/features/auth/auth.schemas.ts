/**
 * Auth request schemas (zod) — signup and login bodies.
 */

import { z } from 'zod'

const signUpSchema = z.object({
  email: z.email().min(5).max(57),
  username: z.string().min(1).max(20),
  password: z.string().min(8).max(57)
})

const loginSchema = z.object({
  username: z.string().min(1).max(20),
  password: z.string().min(8).max(57)
})


export { signUpSchema, loginSchema};
