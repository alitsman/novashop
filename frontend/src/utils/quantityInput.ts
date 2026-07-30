const BLOCKED_QUANTITY_INPUT_KEYS = new Set(["e", "E", "+", "-", ".", ","]);

export function isQuantityDraftAllowed(value: string): boolean {
  return /^\d*$/.test(value);
}

export function isQuantityInputKeyBlocked(key: string): boolean {
  return BLOCKED_QUANTITY_INPUT_KEYS.has(key);
}

export function getIncreasedQuantity(quantity: number, minQuantity: number): number {
  return quantity < minQuantity ? minQuantity : quantity + 1;
}

export function getDecreasedQuantity(quantity: number, maxQuantity: number): number {
  return quantity > maxQuantity ? maxQuantity : quantity - 1;
}
