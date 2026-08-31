import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { ApiError } from "../../services/apiClient";
import { productsService } from "../../services/productsService";
import type { Product, ProductInput } from "../../types/product";
import { loginUser, registerUser, selectAuthToken, sessionExpired } from "../auth/authSlice";

export const ProductsRequestStatus = {
  Idle: "idle",
  Loading: "loading",
  Succeeded: "succeeded",
  Failed: "failed",
} as const;

export type ProductsRequestStatus =
  (typeof ProductsRequestStatus)[keyof typeof ProductsRequestStatus];

export type ProductsState = {
  items: Product[];
  selectedProduct: Product | null;
  listStatus: ProductsRequestStatus;
  detailStatus: ProductsRequestStatus;
  mutationStatus: ProductsRequestStatus;
  deleteStatus: ProductsRequestStatus;
  listRequestId: string | null;
  detailRequestId: string | null;
  mutationRequestId: string | null;
  deleteRequestId: string | null;
  listError: string | null;
  detailError: string | null;
  mutationError: string | null;
  deleteError: string | null;
};

export type UpdateProductPayload = {
  id: string;
  data: ProductInput;
};

const PRODUCT_DATA_LOAD_ERROR_MESSAGE = "Please check your connection and try again.";

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  listStatus: ProductsRequestStatus.Idle,
  detailStatus: ProductsRequestStatus.Idle,
  mutationStatus: ProductsRequestStatus.Idle,
  deleteStatus: ProductsRequestStatus.Idle,
  listRequestId: null,
  detailRequestId: null,
  mutationRequestId: null,
  deleteRequestId: null,
  listError: null,
  detailError: null,
  mutationError: null,
  deleteError: null,
};

const handleRequestError = (
  error: unknown,
  fallbackMessage: string,
  {
    dispatch,
    sessionToken,
  }: {
    dispatch: (action: ReturnType<typeof sessionExpired>) => void;
    sessionToken: string | null;
  },
): string => {
  if (error instanceof ApiError && error.statusCode === 401) {
    dispatch(sessionExpired(sessionToken));
  }

  return error instanceof Error ? error.message : fallbackMessage;
};

export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { state: RootState; rejectValue: string }
>("products/fetchProducts", async (_, { dispatch, getState, rejectWithValue }) => {
  const sessionToken = selectAuthToken(getState());

  try {
    return await productsService.getProducts();
  } catch (error) {
    return rejectWithValue(
      handleRequestError(error, PRODUCT_DATA_LOAD_ERROR_MESSAGE, { dispatch, sessionToken }),
    );
  }
});

export const fetchProductById = createAsyncThunk<
  Product | null,
  string,
  { state: RootState; rejectValue: string }
>("products/fetchProductById", async (productId, { dispatch, getState, rejectWithValue }) => {
  const sessionToken = selectAuthToken(getState());

  try {
    return await productsService.getProductById(productId);
  } catch (error) {
    return rejectWithValue(
      handleRequestError(error, PRODUCT_DATA_LOAD_ERROR_MESSAGE, { dispatch, sessionToken }),
    );
  }
});

export const createProduct = createAsyncThunk<
  Product,
  ProductInput,
  { state: RootState; rejectValue: string }
>("products/createProduct", async (data, { dispatch, getState, rejectWithValue }) => {
  const sessionToken = selectAuthToken(getState());

  try {
    return await productsService.createProduct(data);
  } catch (error) {
    return rejectWithValue(
      handleRequestError(error, "Failed to create product", { dispatch, sessionToken }),
    );
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  UpdateProductPayload,
  { state: RootState; rejectValue: string }
>("products/updateProduct", async ({ id, data }, { dispatch, getState, rejectWithValue }) => {
  const sessionToken = selectAuthToken(getState());

  try {
    return await productsService.updateProduct(id, data);
  } catch (error) {
    return rejectWithValue(
      handleRequestError(error, "Failed to update product", { dispatch, sessionToken }),
    );
  }
});

export const deleteProduct = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>("products/deleteProduct", async (productId, { dispatch, getState, rejectWithValue }) => {
  const sessionToken = selectAuthToken(getState());

  try {
    await productsService.deleteProduct(productId);

    return productId;
  } catch (error) {
    return rejectWithValue(
      handleRequestError(error, "Failed to delete product", { dispatch, sessionToken }),
    );
  }
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSelectedProduct: (productsState) => {
      productsState.selectedProduct = null;
      productsState.detailStatus = ProductsRequestStatus.Idle;
      productsState.detailRequestId = null;
      productsState.detailError = null;
    },
    clearProductsMutationError: (productsState) => {
      productsState.mutationError = null;
    },
    clearProductsDeleteError: (productsState) => {
      productsState.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, () => {
        return initialState;
      })
      .addCase(registerUser.fulfilled, () => {
        return initialState;
      })
      .addCase(fetchProducts.pending, (productsState, action) => {
        productsState.listStatus = ProductsRequestStatus.Loading;
        productsState.listRequestId = action.meta.requestId;
        productsState.listError = null;
      })
      .addCase(fetchProducts.fulfilled, (productsState, action) => {
        if (productsState.listRequestId !== action.meta.requestId) {
          return;
        }

        productsState.items = action.payload;
        productsState.listStatus = ProductsRequestStatus.Succeeded;
        productsState.listRequestId = null;
        productsState.listError = null;
      })
      .addCase(fetchProducts.rejected, (productsState, action) => {
        if (productsState.listRequestId !== action.meta.requestId) {
          return;
        }

        productsState.listStatus = ProductsRequestStatus.Failed;
        productsState.listRequestId = null;
        productsState.listError = action.payload ?? PRODUCT_DATA_LOAD_ERROR_MESSAGE;
      })
      .addCase(fetchProductById.pending, (productsState, action) => {
        productsState.detailStatus = ProductsRequestStatus.Loading;
        productsState.detailRequestId = action.meta.requestId;
        productsState.detailError = null;
        productsState.selectedProduct = null;
      })
      .addCase(fetchProductById.fulfilled, (productsState, action) => {
        if (productsState.detailRequestId !== action.meta.requestId) {
          return;
        }

        productsState.selectedProduct = action.payload;
        productsState.detailStatus = ProductsRequestStatus.Succeeded;
        productsState.detailRequestId = null;
        productsState.detailError = null;
      })
      .addCase(fetchProductById.rejected, (productsState, action) => {
        if (productsState.detailRequestId !== action.meta.requestId) {
          return;
        }

        productsState.detailStatus = ProductsRequestStatus.Failed;
        productsState.detailRequestId = null;
        productsState.detailError = action.payload ?? PRODUCT_DATA_LOAD_ERROR_MESSAGE;
        productsState.selectedProduct = null;
      })
      .addCase(createProduct.pending, (productsState, action) => {
        productsState.mutationStatus = ProductsRequestStatus.Loading;
        productsState.mutationRequestId = action.meta.requestId;
        productsState.mutationError = null;
      })
      .addCase(createProduct.fulfilled, (productsState, action) => {
        if (productsState.mutationRequestId !== action.meta.requestId) {
          return;
        }

        productsState.items.push(action.payload);
        productsState.mutationStatus = ProductsRequestStatus.Succeeded;
        productsState.mutationRequestId = null;
        productsState.mutationError = null;
      })
      .addCase(createProduct.rejected, (productsState, action) => {
        if (productsState.mutationRequestId !== action.meta.requestId) {
          return;
        }

        productsState.mutationStatus = ProductsRequestStatus.Failed;
        productsState.mutationRequestId = null;
        productsState.mutationError = action.payload ?? "Failed to create product";
      })
      .addCase(updateProduct.pending, (productsState, action) => {
        productsState.mutationStatus = ProductsRequestStatus.Loading;
        productsState.mutationRequestId = action.meta.requestId;
        productsState.mutationError = null;
      })
      .addCase(updateProduct.fulfilled, (productsState, action) => {
        if (productsState.mutationRequestId !== action.meta.requestId) {
          return;
        }

        productsState.items = productsState.items.map((product) => {
          if (product.id === action.payload.id) {
            return action.payload;
          }

          return product;
        });

        if (productsState.selectedProduct?.id === action.payload.id) {
          productsState.selectedProduct = action.payload;
        }

        productsState.mutationStatus = ProductsRequestStatus.Succeeded;
        productsState.mutationRequestId = null;
        productsState.mutationError = null;
      })
      .addCase(updateProduct.rejected, (productsState, action) => {
        if (productsState.mutationRequestId !== action.meta.requestId) {
          return;
        }

        productsState.mutationStatus = ProductsRequestStatus.Failed;
        productsState.mutationRequestId = null;
        productsState.mutationError = action.payload ?? "Failed to update product";
      })
      .addCase(deleteProduct.pending, (productsState, action) => {
        productsState.deleteStatus = ProductsRequestStatus.Loading;
        productsState.deleteRequestId = action.meta.requestId;
        productsState.deleteError = null;
      })
      .addCase(deleteProduct.fulfilled, (productsState, action) => {
        if (productsState.deleteRequestId !== action.meta.requestId) {
          return;
        }

        productsState.items = productsState.items.filter((product) => {
          return product.id !== action.payload;
        });

        if (productsState.selectedProduct?.id === action.payload) {
          productsState.selectedProduct = null;
        }

        productsState.deleteStatus = ProductsRequestStatus.Succeeded;
        productsState.deleteRequestId = null;
        productsState.deleteError = null;
      })
      .addCase(deleteProduct.rejected, (productsState, action) => {
        if (productsState.deleteRequestId !== action.meta.requestId) {
          return;
        }

        productsState.deleteStatus = ProductsRequestStatus.Failed;
        productsState.deleteRequestId = null;
        productsState.deleteError = action.payload ?? "Failed to delete product";
      });
  },
});

export const { clearSelectedProduct, clearProductsMutationError, clearProductsDeleteError } =
  productsSlice.actions;

export const productsReducer = productsSlice.reducer;

export const selectProducts = (rootState: RootState) => rootState.products.items;

export const selectSelectedProduct = (rootState: RootState) => rootState.products.selectedProduct;

export const selectProductsListStatus = (rootState: RootState) => rootState.products.listStatus;

export const selectProductDetailsStatus = (rootState: RootState) => rootState.products.detailStatus;

export const selectProductsMutationStatus = (rootState: RootState) =>
  rootState.products.mutationStatus;

export const selectProductsDeleteStatus = (rootState: RootState) => rootState.products.deleteStatus;

export const selectProductsListError = (rootState: RootState) => rootState.products.listError;

export const selectProductDetailError = (rootState: RootState) => rootState.products.detailError;

export const selectProductsMutationError = (rootState: RootState) =>
  rootState.products.mutationError;

export const selectProductsDeleteError = (rootState: RootState) => rootState.products.deleteError;

export const selectCategories = createSelector([selectProducts], (products) => {
  const categories = products.map((product) => product.category);

  return Array.from(new Set(categories));
});

export const selectAdminProducts = createSelector([selectProducts], (products) => {
  return [...products].sort((firstProduct, secondProduct) => {
    const firstCreatedAt = firstProduct.createdAt ?? "";
    const secondCreatedAt = secondProduct.createdAt ?? "";

    return secondCreatedAt.localeCompare(firstCreatedAt);
  });
});
