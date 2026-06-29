import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { CartItem, CartState } from "../../types/cart";

type SetQuantityPayload = {
  productId: string;
  quantity: number;
};

type RestoreCartPayload = {
  userId: string;
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
  error: null,
  ownerUserId: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    restoreCart: (cartState, action: PayloadAction<RestoreCartPayload>) => {
      cartState.items = action.payload.items;
      cartState.error = null;
      cartState.ownerUserId = action.payload.userId;
    },

    resetCart: (cartState) => {
      cartState.items = [];
      cartState.error = null;
      cartState.ownerUserId = null;
    },

    addToCart: (cartState, action: PayloadAction<CartItem>) => {
      const newCartItem = action.payload;

      if (newCartItem.stock <= 0) {
        cartState.error = "This product is not available.";
        return;
      }

      if (!Number.isInteger(newCartItem.quantity)) {
        cartState.error = "Quantity must be a whole number.";
        return;
      }

      if (newCartItem.quantity < 1) {
        cartState.error = "Quantity must be at least 1.";
        return;
      }

      const existingCartItem = cartState.items.find((cartItem) => {
        return cartItem.productId === newCartItem.productId;
      });

      const currentQuantityInCart = existingCartItem?.quantity ?? 0;
      const availableToAdd = newCartItem.stock - currentQuantityInCart;

      if (availableToAdd <= 0) {
        cartState.error = "No more items available.";
        return;
      }

      if (newCartItem.quantity > availableToAdd) {
        cartState.error = `Only ${availableToAdd} items are available to add.`;
        return;
      }

      if (existingCartItem) {
        existingCartItem.quantity += newCartItem.quantity;
      } else {
        cartState.items.push(newCartItem);
      }

      cartState.error = null;
    },

    clearCartError: (cartState) => {
      cartState.error = null;
    },

    removeFromCart: (cartState, action: PayloadAction<string>) => {
      const productIdToRemove = action.payload;

      cartState.items = cartState.items.filter((cartItem) => {
        return cartItem.productId !== productIdToRemove;
      });

      cartState.error = null;
    },

    increaseQuantity: (cartState, action: PayloadAction<string>) => {
      const productIdToIncrease = action.payload;

      const existingCartItem = cartState.items.find((cartItem) => {
        return cartItem.productId === productIdToIncrease;
      });

      if (!existingCartItem) {
        cartState.error = "Product is not in cart.";
        return;
      }

      const nextQuantity = existingCartItem.quantity + 1;

      if (nextQuantity > existingCartItem.stock) {
        cartState.error = "No more items available.";
        return;
      }

      existingCartItem.quantity = nextQuantity;
      cartState.error = null;
    },

    decreaseQuantity: (cartState, action: PayloadAction<string>) => {
      const productIdToDecrease = action.payload;

      const existingCartItem = cartState.items.find((cartItem) => {
        return cartItem.productId === productIdToDecrease;
      });

      if (!existingCartItem) {
        cartState.error = "Product is not in cart.";
        return;
      }

      if (existingCartItem.quantity <= 1) {
        cartState.error = "Quantity must be at least 1.";
        return;
      }

      existingCartItem.quantity -= 1;
      cartState.error = null;
    },

    setQuantity: (cartState, action: PayloadAction<SetQuantityPayload>) => {
      const { productId, quantity } = action.payload;

      const existingCartItem = cartState.items.find((cartItem) => {
        return cartItem.productId === productId;
      });

      if (!existingCartItem) {
        cartState.error = "Product is not in cart.";
        return;
      }

      if (!Number.isInteger(quantity)) {
        cartState.error = "Quantity must be a whole number.";
        return;
      }

      if (quantity < 1) {
        cartState.error = "Quantity must be at least 1.";
        return;
      }

      if (quantity > existingCartItem.stock) {
        cartState.error = `Only ${existingCartItem.stock} items are available in total.`;
        return;
      }

      existingCartItem.quantity = quantity;
      cartState.error = null;
    },

    clearCart: (cartState) => {
      cartState.items = [];
      cartState.error = null;
    },
  },
});

export const {
  restoreCart,
  resetCart,
  addToCart,
  clearCartError,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  clearCart,
} = cartSlice.actions;

export const selectCartItems = (state: RootState) => {
  return state.cart.items;
};

export const selectCartError = (state: RootState) => {
  return state.cart.error;
};

export const selectCartOwnerUserId = (state: RootState) => {
  return state.cart.ownerUserId;
};

export const selectCartTotalQuantity = (state: RootState) => {
  return state.cart.items.reduce((totalQuantity, cartItem) => {
    return totalQuantity + cartItem.quantity;
  }, 0);
};

export const selectCartTotalPrice = (state: RootState) => {
  return state.cart.items.reduce((totalPrice, cartItem) => {
    return totalPrice + cartItem.price * cartItem.quantity;
  }, 0);
};

export const selectIsCartEmpty = (state: RootState) => {
  return state.cart.items.length === 0;
};

export const cartReducer = cartSlice.reducer;
