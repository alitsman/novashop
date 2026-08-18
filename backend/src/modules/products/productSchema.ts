import { z } from "zod";

export const productIdParamsSchema = z.object({
  id: z.uuid(),
});

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
