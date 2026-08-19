import { z } from "zod";

import type { Product } from "../types";

export const productSchema: z.ZodType<Product> = z
  .object({
    id: z.uuid(),
    title: z.string().min(1),
    price: z.number().positive(),
    category: z.string().min(1),
    imageUrl: z.url(),
    description: z.string().min(1),
    stock: z.number().int().nonnegative(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

export const productListSchema = z.array(productSchema);
