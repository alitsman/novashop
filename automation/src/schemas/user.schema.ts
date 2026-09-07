import { z } from "zod";

import type { AuthUser } from "../types";

export const userSchema: z.ZodType<AuthUser> = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    email: z.email(),
    role: z.enum(["user", "admin"]),
  })
  .strict();
