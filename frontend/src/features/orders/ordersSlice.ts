import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ordersService } from "../../services/ordersService";
import type { CreateOrderPayload, Order } from "../../types/order";
import { selectAuthToken } from "../auth/authSlice";
import { handleRequestError } from "../auth/handleRequestError";

export const OrdersRequestStatus = {
  Idle: "idle",
  Loading: "loading",
  Succeeded: "succeeded",
  Failed: "failed",
} as const;

export type OrdersRequestStatus = (typeof OrdersRequestStatus)[keyof typeof OrdersRequestStatus];

export type OrdersState = {
  items: Order[];
  fetchStatus: OrdersRequestStatus;
  createStatus: OrdersRequestStatus;
  fetchRequestId: string | null;
  createRequestId: string | null;
  fetchError: string | null;
  createError: string | null;
};

export const fetchMyOrders = createAsyncThunk<
  Order[],
  void,
  { state: RootState; rejectValue: string }
>("orders/fetchMyOrders", async (_, { dispatch, getState, rejectWithValue }) => {
  const sessionToken = selectAuthToken(getState());

  try {
    return await ordersService.getMyOrders();
  } catch (error) {
    return rejectWithValue(
      handleRequestError(error, "Failed to fetch orders.", { dispatch, sessionToken }),
    );
  }
});

export const createOrder = createAsyncThunk<
  Order,
  CreateOrderPayload,
  { state: RootState; rejectValue: string }
>(
  "orders/createOrder",
  async (orderData, { dispatch, getState, rejectWithValue }) => {
    const sessionToken = selectAuthToken(getState());

    try {
      return await ordersService.createOrder(orderData);
    } catch (error) {
      return rejectWithValue(
        handleRequestError(error, "Failed to create order.", { dispatch, sessionToken }),
      );
    }
  },
  {
    condition: (_, { getState }) => {
      return getState().orders.createStatus !== OrdersRequestStatus.Loading;
    },
  },
);

const initialState: OrdersState = {
  items: [],
  fetchStatus: OrdersRequestStatus.Idle,
  createStatus: OrdersRequestStatus.Idle,
  fetchRequestId: null,
  createRequestId: null,
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
    resetOrders: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (ordersState, action) => {
        ordersState.fetchStatus = OrdersRequestStatus.Loading;
        ordersState.fetchRequestId = action.meta.requestId;
        ordersState.fetchError = null;
      })
      .addCase(fetchMyOrders.fulfilled, (ordersState, action) => {
        if (ordersState.fetchRequestId !== action.meta.requestId) {
          return;
        }

        ordersState.items = action.payload;
        ordersState.fetchStatus = OrdersRequestStatus.Succeeded;
        ordersState.fetchRequestId = null;
        ordersState.fetchError = null;
      })
      .addCase(fetchMyOrders.rejected, (ordersState, action) => {
        if (ordersState.fetchRequestId !== action.meta.requestId) {
          return;
        }

        ordersState.fetchStatus = OrdersRequestStatus.Failed;
        ordersState.fetchRequestId = null;
        ordersState.fetchError = action.payload ?? "Failed to fetch orders.";
      })
      .addCase(createOrder.pending, (ordersState, action) => {
        ordersState.createStatus = OrdersRequestStatus.Loading;
        ordersState.createRequestId = action.meta.requestId;
        ordersState.createError = null;
      })
      .addCase(createOrder.fulfilled, (ordersState, action) => {
        if (ordersState.createRequestId !== action.meta.requestId) {
          return;
        }

        ordersState.items.unshift(action.payload);
        ordersState.createStatus = OrdersRequestStatus.Succeeded;
        ordersState.createError = null;
        // Keep the ID so checkout can verify its result after await.
      })
      .addCase(createOrder.rejected, (ordersState, action) => {
        if (ordersState.createRequestId !== action.meta.requestId) {
          return;
        }

        ordersState.createStatus = OrdersRequestStatus.Failed;
        ordersState.createError = action.payload ?? "Failed to create order.";
      });
  },
});

export const { clearOrdersCreateError, resetOrders } = ordersSlice.actions;

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
