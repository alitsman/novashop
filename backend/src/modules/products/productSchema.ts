import { z } from "zod";

import type { ProductInput } from "./productTypes.js";

const MAX_PRODUCT_TITLE_LENGTH = 80;
const MAX_CATEGORY_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 300;
const MAX_PRICE = 999_999;
const MAX_STOCK = 100_000;

const ANGLE_BRACKETS_PATTERN = /[<>]/;
const UNICODE_LETTER_OR_DIGIT_PATTERN = /[\p{L}\p{N}]/u;

const hasDisallowedControlCharacters = (value: string): boolean => {
  return Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0);
    const isAllowedWhitespace = characterCode === 9 || characterCode === 10 || characterCode === 13;

    return (
      !isAllowedWhitespace && ((characterCode >= 0 && characterCode <= 31) || characterCode === 127)
    );
  });
};

const createProductTextSchema = (minimumLength: number, maximumLength: number) => {
  return z
    .string()
    .trim()
    .min(minimumLength)
    .max(maximumLength)
    .regex(UNICODE_LETTER_OR_DIGIT_PATTERN)
    .refine((value) => !ANGLE_BRACKETS_PATTERN.test(value))
    .refine((value) => !hasDisallowedControlCharacters(value));
};

const imageUrlSchema = z
  .string()
  .trim()
  .pipe(z.url())
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;

      return protocol === "http:" || protocol === "https:";
    } catch {
      // Invalid URL formats are reported by z.url().
      return true;
    }
  });

// Do not add .strict() here.
// Unknown fields are removed so clients cannot set id, deletedAt, or timestamps.
export const createProductSchema: z.ZodType<ProductInput> = z.object({
  title: createProductTextSchema(2, MAX_PRODUCT_TITLE_LENGTH),
  price: z.number().positive().max(MAX_PRICE).multipleOf(0.01),
  category: createProductTextSchema(2, MAX_CATEGORY_LENGTH),
  imageUrl: imageUrlSchema,
  description: createProductTextSchema(10, MAX_DESCRIPTION_LENGTH),
  stock: z.number().int().min(0).max(MAX_STOCK),
});

export const productIdParamsSchema = z.object({
  id: z.uuid(),
});

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
