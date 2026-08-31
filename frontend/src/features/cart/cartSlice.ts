import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { cartService } from "../../services/cartService";
import { productsService } from "../../services/productsService";
import { CartRequestStatus, type CartItem, type CartState } from "../../types/cart";
import type { Product } from "../../types/product";
import { selectAuthToken, selectCurrentUser } from "../auth/authSlice";
import { handleRequestError } from "../auth/handleRequestError";

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
  syncStatus: CartRequestStatus.Idle,
  syncRequestId: null,
  syncError: null,
};

export const syncCart = createAsyncThunk<
  Product[],
  void,
  { state: RootState; rejectValue: string }
>(
  "cart/syncCart",
  async (_, { dispatch, getState, rejectWithValue }) => {
    const sessionToken = selectAuthToken(getState());

    try {
      return await productsService.getProducts();
    } catch (error) {
      return rejectWithValue(
        handleRequestError(error, "Failed to check cart. Please try again.", {
          dispatch,
          sessionToken,
        }),
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState();
      const currentUser = selectCurrentUser(state);

      return Boolean(
        selectAuthToken(state) && currentUser && state.cart.ownerUserId === currentUser.id,
      );
    },
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    restoreCart: (cartState, action: PayloadAction<RestoreCartPayload>) => {
      cartState.items = action.payload.items;
      cartState.error = null;
      cartState.ownerUserId = action.payload.userId;
      cartState.syncStatus = CartRequestStatus.Idle;
      cartState.syncRequestId = null;
      cartState.syncError = null;
    },

    resetCart: () => {
      return initialState;
    },

    invalidateCartSync: (cartState) => {
      cartState.syncStatus = CartRequestStatus.Idle;
      cartState.syncRequestId = null;
      cartState.syncError = null;
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
      cartState.syncStatus = CartRequestStatus.Idle;
      cartState.syncRequestId = null;
      cartState.syncError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncCart.pending, (cartState, action) => {
        cartState.syncStatus = CartRequestStatus.Loading;
        cartState.syncRequestId = action.meta.requestId;
        cartState.syncError = null;
      })
      .addCase(syncCart.fulfilled, (cartState, action) => {
        if (cartState.syncRequestId !== action.meta.requestId) {
          return;
        }

        cartState.items = cartService.reconcileCartItems(cartState.items, action.payload);
        cartState.syncStatus = CartRequestStatus.Succeeded;
        cartState.syncError = null;
        // Keep the ID so checkout can verify that this was its sync request.
      })
      .addCase(syncCart.rejected, (cartState, action) => {
        if (cartState.syncRequestId !== action.meta.requestId) {
          return;
        }

        cartState.syncStatus = CartRequestStatus.Failed;
        cartState.syncError = action.payload ?? "Failed to check cart. Please try again.";
      });
  },
});

export const {
  restoreCart,
  resetCart,
  invalidateCartSync,
  addToCart,
  clearCartError,
  removeFromCart,
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

export const selectCartSyncStatus = (state: RootState) => {
  return state.cart.syncStatus;
};

export const selectCartSyncError = (state: RootState) => {
  return state.cart.syncError;
};

export const selectCartSyncRequestId = (state: RootState) => {
  return state.cart.syncRequestId;
};

export const selectCartCheckoutError = (state: RootState) => {
  return cartService.getCheckoutError(state.cart.items);
};

export const selectCartTotalQuantity = (state: RootState) => {
  return state.cart.items.reduce((totalQuantity, cartItem) => {
    return totalQuantity + cartItem.quantity;
  }, 0);
};

export const selectCartTotalPrice = (state: RootState) => {
  const totalInCents = state.cart.items.reduce((total, cartItem) => {
    const priceInCents = Math.round(cartItem.price * 100);

    return total + priceInCents * cartItem.quantity;
  }, 0);

  return totalInCents / 100;
};

export const selectIsCartEmpty = (state: RootState) => {
  return state.cart.items.length === 0;
};

export const cartReducer = cartSlice.reducer;
