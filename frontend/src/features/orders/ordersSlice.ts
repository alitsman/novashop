import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ordersService } from "../../services/ordersService";
import type { CreateOrderPayload, Order } from "../../types/order";

export const OrdersRequestStatus = {
  Idle: "idle",
  Loading: "loading",
  Succeeded: "succeeded",
  Failed: "failed",
} as const;

export type OrdersRequestStatus =
  (typeof OrdersRequestStatus)[keyof typeof OrdersRequestStatus];

export type OrdersState = {
  items: Order[];
  fetchStatus: OrdersRequestStatus;
  createStatus: OrdersRequestStatus;
  fetchError: string | null;
  createError: string | null;
};

export const fetchMyOrders = createAsyncThunk<
  Order[],
  string,
  { rejectValue: string }
>("orders/fetchMyOrders", async (userId, { rejectWithValue }) => {
  try {
    return await ordersService.getMyOrders(userId);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to fetch orders.");
  }
});

export const createOrder = createAsyncThunk<
  Order,
  CreateOrderPayload,
  { rejectValue: string }
>("orders/createOrder", async (orderData, { rejectWithValue }) => {
  try {
    return await ordersService.createOrder(orderData);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to create order.");
  }
});

const initialState: OrdersState = {
  items: [],
  fetchStatus: OrdersRequestStatus.Idle,
  createStatus: OrdersRequestStatus.Idle,
  fetchError: null,
  createError: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrdersCreateError: (ordersState) => {
      ordersState.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (ordersState) => {
        ordersState.fetchStatus = OrdersRequestStatus.Loading;
        ordersState.fetchError = null;
      })
      .addCase(fetchMyOrders.fulfilled, (ordersState, action) => {
        ordersState.items = action.payload;
        ordersState.fetchStatus = OrdersRequestStatus.Succeeded;
        ordersState.fetchError = null;
      })
      .addCase(fetchMyOrders.rejected, (ordersState, action) => {
        ordersState.fetchStatus = OrdersRequestStatus.Failed;
        ordersState.fetchError = action.payload ?? "Failed to fetch orders.";
      })
      .addCase(createOrder.pending, (ordersState) => {
        ordersState.createStatus = OrdersRequestStatus.Loading;
        ordersState.createError = null;
      })
      .addCase(createOrder.fulfilled, (ordersState, action) => {
        ordersState.items.unshift(action.payload);
        ordersState.createStatus = OrdersRequestStatus.Succeeded;
        ordersState.createError = null;
      })
      .addCase(createOrder.rejected, (ordersState, action) => {
        ordersState.createStatus = OrdersRequestStatus.Failed;
        ordersState.createError = action.payload ?? "Failed to create order.";
      });
  },
});

export const { clearOrdersCreateError } = ordersSlice.actions;

export const selectOrders = (state: RootState) => {
  return state.orders.items;
};

export const selectOrdersFetchStatus = (state: RootState) => {
  return state.orders.fetchStatus;
};

export const selectOrdersCreateStatus = (state: RootState) => {
  return state.orders.createStatus;
};

export const selectOrdersFetchError = (state: RootState) => {
  return state.orders.fetchError;
};

export const selectOrdersCreateError = (state: RootState) => {
  return state.orders.createError;
};

export const selectIsOrdersEmpty = (state: RootState) => {
  return state.orders.items.length === 0;
};

export const ordersReducer = ordersSlice.reducer;
