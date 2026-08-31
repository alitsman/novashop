import type { CartItem } from "../types/cart";
import type { Product } from "../types/product";
import { storage } from "../utils/storage";

const CART_ITEMS_STORAGE_KEY_PREFIX = "novashop-cart-items";
const MAX_ORDER_ITEMS = 100;

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

  reconcileCartItems(items: CartItem[], products: Product[]): CartItem[] {
    const productsById = new Map(products.map((product) => [product.id, product]));

    return items.map((cartItem) => {
      const product = productsById.get(cartItem.productId);

      if (!product) {
        // Keep unavailable items so the user can review and remove them.
        return { ...cartItem, stock: 0 };
      }

      return {
        ...cartItem,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
      };
    });
  },

  getCheckoutError(items: CartItem[]): string | null {
    if (items.length === 0) {
      return "Your cart is empty. Add products before placing an order.";
    }

    if (items.length > MAX_ORDER_ITEMS) {
      return `An order can contain at most ${MAX_ORDER_ITEMS} different products.`;
    }

    for (const cartItem of items) {
      if (cartItem.stock <= 0) {
        return `${cartItem.title} is unavailable. Remove it from your cart before checkout.`;
      }

      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
        return `Enter a whole-number quantity of at least 1 for ${cartItem.title}.`;
      }

      if (cartItem.quantity > cartItem.stock) {
        return `Only ${cartItem.stock} items of ${cartItem.title} are available. Update the quantity in your cart.`;
      }
    }

    return null;
  },
};
