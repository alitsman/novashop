import { z } from "zod";

import { DeliveryMethod, PaymentMethod } from "./orderTypes.js";
import type { CreateOrderInput, CreateOrderItemInput } from "./orderTypes.js";

const MIN_FULL_NAME_LENGTH = 2;
const MAX_FULL_NAME_LENGTH = 80;
const MIN_ADDRESS_LENGTH = 5;
const MAX_ADDRESS_LENGTH = 200;
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;
const MAX_ORDER_ITEMS = 100;
const MAX_ITEM_QUANTITY = 100_000;

const FULL_NAME_ALLOWED_CHARACTERS_PATTERN = /^[\p{L}\p{M} .'\u2019-]+$/u;
const PHONE_ALLOWED_CHARACTERS_PATTERN = /^[0-9+\s()-]+$/;
const UNICODE_LETTER_PATTERN = /\p{L}/u;
const UNICODE_LETTER_OR_DIGIT_PATTERN = /[\p{L}\p{N}]/u;
const ANGLE_BRACKETS_PATTERN = /[<>]/;

const hasDisallowedControlCharacters = (value: string): boolean => {
  return Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0);
    const isAllowedWhitespace = characterCode === 9 || characterCode === 10 || characterCode === 13;

    return (
      !isAllowedWhitespace && ((characterCode >= 0 && characterCode <= 31) || characterCode === 127)
    );
  });
};

const getPhoneDigits = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

const getPlusSignCount = (value: string): number => {
  return value.match(/\+/g)?.length ?? 0;
};

const fullNameSchema = z
  .string()
  .trim()
  .min(MIN_FULL_NAME_LENGTH)
  .max(MAX_FULL_NAME_LENGTH)
  .regex(UNICODE_LETTER_PATTERN)
  .regex(FULL_NAME_ALLOWED_CHARACTERS_PATTERN);

const phoneSchema = z
  .string()
  .trim()
  .refine((value) => {
    return PHONE_ALLOWED_CHARACTERS_PATTERN.test(value) && !hasDisallowedControlCharacters(value);
  })
  .refine((value) => getPlusSignCount(value) <= 1)
  .refine((value) => !value.includes("+") || value.startsWith("+"))
  .refine((value) => getPhoneDigits(value).length >= MIN_PHONE_DIGITS)
  .refine((value) => getPhoneDigits(value).length <= MAX_PHONE_DIGITS);

const addressSchema = z
  .string()
  .trim()
  .min(MIN_ADDRESS_LENGTH)
  .max(MAX_ADDRESS_LENGTH)
  .regex(UNICODE_LETTER_OR_DIGIT_PATTERN)
  .refine((value) => !ANGLE_BRACKETS_PATTERN.test(value))
  .refine((value) => !hasDisallowedControlCharacters(value));

const createOrderItemSchema: z.ZodType<CreateOrderItemInput> = z.object({
  productId: z.uuid().transform((value) => value.toLowerCase()),
  quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
});

const orderItemsSchema = z
  .array(createOrderItemSchema)
  .min(1)
  .max(MAX_ORDER_ITEMS)
  .refine((items) => {
    const productIds = items.map((item) => item.productId);

    return new Set(productIds).size === productIds.length;
  });

// Do not add .strict() here.
// Unknown fields are removed so clients cannot set prices, totals, user IDs,
// order numbers, or timestamps.
export const createOrderSchema: z.ZodType<CreateOrderInput> = z.object({
  items: orderItemsSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
  address: addressSchema,
  deliveryMethod: z.enum([DeliveryMethod.Standard, DeliveryMethod.Express]),
  paymentMethod: z.enum([PaymentMethod.Cash, PaymentMethod.Card]),
});

export const orderIdParamsSchema = z.object({
  id: z.uuid(),
});

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
