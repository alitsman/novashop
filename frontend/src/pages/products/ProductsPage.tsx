import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchProducts,
  ProductsRequestStatus,
  selectProductsListError,
  selectProductsListStatus,
} from "../../features/products/productsSlice";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { ProductsPageView } from "./ProductsPageView";
import { useProductsFilters } from "./useProductsFilters";

export function ProductsPage() {
  useDocumentTitle("Products");

  const dispatch = useAppDispatch();

  const listStatus = useAppSelector(selectProductsListStatus);
  const listError = useAppSelector(selectProductsListError);

  const {
    products,
    totalProductsCount,
    categories,
    searchDraft,
    selectedCategory,
    sortOrder,
    hasActiveFilters,
    handleSearchChange,
    handleSearchClear,
    handleCategoryChange,
    handleSortOrderChange,
    handleClearFilters,
  } = useProductsFilters();

  const isLoading = listStatus === ProductsRequestStatus.Loading;
  const hasError = listStatus === ProductsRequestStatus.Failed;
  const isLoaded = listStatus === ProductsRequestStatus.Succeeded;

  const shouldShowFilters = isLoaded && totalProductsCount > 0;
  const isCatalogEmpty = isLoaded && totalProductsCount === 0;
  const isFilteredEmpty = isLoaded && totalProductsCount > 0 && products.length === 0;

  const loadingMessage = isLoading ? "Loading products..." : null;
  const errorMessage = hasError ? listError : null;

  const resultsMessage =
    isLoaded && totalProductsCount > 0
      ? `${products.length} ${products.length === 1 ? "product" : "products"} found.`
      : null;

  useEffect(() => {
    if (listStatus === ProductsRequestStatus.Idle) {
      void dispatch(fetchProducts());
    }
  }, [dispatch, listStatus]);

  return (
    <ProductsPageView
      products={products}
      shouldShowFilters={shouldShowFilters}
      isCatalogEmpty={isCatalogEmpty}
      isFilteredEmpty={isFilteredEmpty}
      categories={categories}
      searchValue={searchDraft}
      selectedCategory={selectedCategory}
      sortOrder={sortOrder}
      hasActiveFilters={hasActiveFilters}
      loadingMessage={loadingMessage}
      errorMessage={errorMessage}
      resultsMessage={resultsMessage}
      onSearchChange={handleSearchChange}
      onSearchClear={handleSearchClear}
      onCategoryChange={handleCategoryChange}
      onSortOrderChange={handleSortOrderChange}
      onClearFilters={handleClearFilters}
    />
  );
}
