import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { productsService } from "../../services/productsService";
import {
  ProductSortOrder,
  type Product,
  type ProductInput,
} from "../../types/product";

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
  error: string | null;
  mutationError: string | null;
  deleteError: string | null;
  searchQuery: string;
  selectedCategory: string;
  sortOrder: ProductSortOrder;
};

export type UpdateProductPayload = {
  id: string;
  data: ProductInput;
};

const initialState: ProductsState = {
  items: [],
  selectedProduct: null,
  listStatus: ProductsRequestStatus.Idle,
  detailStatus: ProductsRequestStatus.Idle,
  mutationStatus: ProductsRequestStatus.Idle,
  deleteStatus: ProductsRequestStatus.Idle,
  error: null,
  mutationError: null,
  deleteError: null,
  searchQuery: "",
  selectedCategory: "",
  sortOrder: ProductSortOrder.Default,
};

export const fetchProducts = createAsyncThunk<
  Product[],
  void,
  { rejectValue: string }
>("products/fetchProducts", async (_, { rejectWithValue }) => {
  try {
    return await productsService.getProducts();
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to load products");
  }
});

export const fetchProductById = createAsyncThunk<
  Product | null,
  string,
  { rejectValue: string }
>("products/fetchProductById", async (productId, { rejectWithValue }) => {
  try {
    return await productsService.getProductById(productId);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to load product");
  }
});

export const createProduct = createAsyncThunk<
  Product,
  ProductInput,
  { rejectValue: string }
>("products/createProduct", async (data, { rejectWithValue }) => {
  try {
    return await productsService.createProduct(data);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to create product");
  }
});

export const updateProduct = createAsyncThunk<
  Product,
  UpdateProductPayload,
  { rejectValue: string }
>("products/updateProduct", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await productsService.updateProduct(id, data);
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to update product");
  }
});

export const deleteProduct = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("products/deleteProduct", async (productId, { rejectWithValue }) => {
  try {
    await productsService.deleteProduct(productId);

    return productId;
  } catch (error) {
    if (error instanceof Error) {
      return rejectWithValue(error.message);
    }

    return rejectWithValue("Failed to delete product");
  }
});

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearSelectedProduct: (productsState) => {
      productsState.selectedProduct = null;
      productsState.detailStatus = ProductsRequestStatus.Idle;
    },
    clearProductsMutationError: (productsState) => {
      productsState.mutationError = null;
    },
    clearProductsDeleteError: (productsState) => {
      productsState.deleteError = null;
    },
    setSearchQuery: (productsState, action: PayloadAction<string>) => {
      productsState.searchQuery = action.payload;
    },
    setSelectedCategory: (productsState, action: PayloadAction<string>) => {
      productsState.selectedCategory = action.payload;
    },
    setSortOrder: (productsState, action: PayloadAction<ProductSortOrder>) => {
      productsState.sortOrder = action.payload;
    },
    clearProductFilters: (productsState) => {
      productsState.searchQuery = "";
      productsState.selectedCategory = "";
      productsState.sortOrder = ProductSortOrder.Default;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (productsState) => {
        productsState.listStatus = ProductsRequestStatus.Loading;
        productsState.error = null;
      })
      .addCase(fetchProducts.fulfilled, (productsState, action) => {
        productsState.items = action.payload;
        productsState.listStatus = ProductsRequestStatus.Succeeded;
        productsState.error = null;
      })
      .addCase(fetchProducts.rejected, (productsState, action) => {
        productsState.listStatus = ProductsRequestStatus.Failed;
        productsState.error = action.payload ?? "Failed to load products";
      })
      .addCase(fetchProductById.pending, (productsState) => {
        productsState.detailStatus = ProductsRequestStatus.Loading;
        productsState.error = null;
        productsState.selectedProduct = null;
      })
      .addCase(fetchProductById.fulfilled, (productsState, action) => {
        productsState.selectedProduct = action.payload;
        productsState.detailStatus = ProductsRequestStatus.Succeeded;
        productsState.error = null;
      })
      .addCase(fetchProductById.rejected, (productsState, action) => {
        productsState.detailStatus = ProductsRequestStatus.Failed;
        productsState.error = action.payload ?? "Failed to load product";
        productsState.selectedProduct = null;
      })
      .addCase(createProduct.pending, (productsState) => {
        productsState.mutationStatus = ProductsRequestStatus.Loading;
        productsState.mutationError = null;
      })
      .addCase(createProduct.fulfilled, (productsState, action) => {
        productsState.items.push(action.payload);
        productsState.mutationStatus = ProductsRequestStatus.Succeeded;
        productsState.mutationError = null;
      })
      .addCase(createProduct.rejected, (productsState, action) => {
        productsState.mutationStatus = ProductsRequestStatus.Failed;
        productsState.mutationError =
          action.payload ?? "Failed to create product";
      })
      .addCase(updateProduct.pending, (productsState) => {
        productsState.mutationStatus = ProductsRequestStatus.Loading;
        productsState.mutationError = null;
      })
      .addCase(updateProduct.fulfilled, (productsState, action) => {
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
        productsState.mutationError = null;
      })
      .addCase(updateProduct.rejected, (productsState, action) => {
        productsState.mutationStatus = ProductsRequestStatus.Failed;
        productsState.mutationError =
          action.payload ?? "Failed to update product";
      })
      .addCase(deleteProduct.pending, (productsState) => {
        productsState.deleteStatus = ProductsRequestStatus.Loading;
        productsState.deleteError = null;
      })
      .addCase(deleteProduct.fulfilled, (productsState, action) => {
        productsState.items = productsState.items.filter((product) => {
          return product.id !== action.payload;
        });

        if (productsState.selectedProduct?.id === action.payload) {
          productsState.selectedProduct = null;
        }

        productsState.deleteStatus = ProductsRequestStatus.Succeeded;
        productsState.deleteError = null;
      })
      .addCase(deleteProduct.rejected, (productsState, action) => {
        productsState.deleteStatus = ProductsRequestStatus.Failed;
        productsState.deleteError =
          action.payload ?? "Failed to delete product";
      });
  },
});

export const {
  clearSelectedProduct,
  clearProductsMutationError,
  clearProductsDeleteError,
  setSearchQuery,
  setSelectedCategory,
  setSortOrder,
  clearProductFilters,
} = productsSlice.actions;

export const productsReducer = productsSlice.reducer;

export const selectProducts = (rootState: RootState) =>
  rootState.products.items;

export const selectSelectedProduct = (rootState: RootState) =>
  rootState.products.selectedProduct;

export const selectProductsListStatus = (rootState: RootState) =>
  rootState.products.listStatus;

export const selectProductDetailsStatus = (rootState: RootState) =>
  rootState.products.detailStatus;

export const selectProductsMutationStatus = (rootState: RootState) =>
  rootState.products.mutationStatus;

export const selectProductsDeleteStatus = (rootState: RootState) =>
  rootState.products.deleteStatus;

export const selectProductsError = (rootState: RootState) =>
  rootState.products.error;

export const selectProductsMutationError = (rootState: RootState) =>
  rootState.products.mutationError;

export const selectProductsDeleteError = (rootState: RootState) =>
  rootState.products.deleteError;

export const selectSearchQuery = (rootState: RootState) =>
  rootState.products.searchQuery;

export const selectSelectedCategory = (rootState: RootState) =>
  rootState.products.selectedCategory;

export const selectSortOrder = (rootState: RootState) =>
  rootState.products.sortOrder;

export const selectCategories = createSelector([selectProducts], (products) => {
  const categories = products.map((product) => product.category);

  return Array.from(new Set(categories));
});

export const selectFilteredProducts = createSelector(
  [selectProducts, selectSearchQuery, selectSelectedCategory, selectSortOrder],
  (products, searchQueryValue, selectedCategory, sortOrder) => {
    const searchQuery = searchQueryValue.trim().toLowerCase();

    const filteredProducts = products.filter((product) => {
      const matchesSearchQuery = product.title
        .toLowerCase()
        .includes(searchQuery);

      const matchesSelectedCategory =
        selectedCategory === "" || product.category === selectedCategory;

      return matchesSearchQuery && matchesSelectedCategory;
    });

    if (sortOrder === ProductSortOrder.PriceAsc) {
      return [...filteredProducts].sort((firstProduct, secondProduct) => {
        return firstProduct.price - secondProduct.price;
      });
    }

    if (sortOrder === ProductSortOrder.PriceDesc) {
      return [...filteredProducts].sort((firstProduct, secondProduct) => {
        return secondProduct.price - firstProduct.price;
      });
    }

    return filteredProducts;
  },
);
