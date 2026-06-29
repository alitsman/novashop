import type { CartItem } from "../types/cart";
import { storage } from "../utils/storage";

const CART_ITEMS_STORAGE_KEY_PREFIX = "novashop-cart-items";

const getCartItemsStorageKey = (userId: string): string => {
  return `${CART_ITEMS_STORAGE_KEY_PREFIX}-${userId}`;
};

export const cartService = {
  getCartItems(userId: string): CartItem[] {
    return storage.getItem<CartItem[]>(getCartItemsStorageKey(userId), []);
  },

  saveCartItems(userId: string, items: CartItem[]): void {
    storage.setItem<CartItem[]>(getCartItemsStorageKey(userId), items);
  },
};
