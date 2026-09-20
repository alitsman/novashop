import { z } from "zod";

import type { ApiErrorResponse } from "../types";

export const apiErrorResponseSchema: z.ZodType<ApiErrorResponse> = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        details: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();
