// user.validator.ts
import { z } from 'zod';

/** runtime‑safe user registration schema */
export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});
