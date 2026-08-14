import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import {
  ProductsRequestStatus,
  selectCategories,
  selectProducts,
  selectProductsListStatus,
} from "../../features/products/productsSlice";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ProductSortOrder } from "../../types/product";
import { filterProducts, type ProductFilters } from "./filterProducts";
import { parseProductsSearchParams, serializeProductsSearchParams } from "./productsSearchParams";

export function useProductsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const allProducts = useAppSelector(selectProducts);
  const categories = useAppSelector(selectCategories);
  const listStatus = useAppSelector(selectProductsListStatus);

  const shouldValidateCategory = listStatus === ProductsRequestStatus.Succeeded;

  const {
    q: appliedQuery,
    category: selectedCategory,
    sort: sortOrder,
  } = parseProductsSearchParams(searchParams, {
    categories,
    shouldValidateCategory,
  });

  const [searchDraft, setSearchDraft] = useState(appliedQuery);
  const debouncedSearchQuery = useDebouncedValue(searchDraft);

  const pendingSearchEcho = useRef<string | null>(null);
  const setSearchParamsRef = useRef(setSearchParams);

  const appliedFiltersRef = useRef<ProductFilters>({
    q: appliedQuery,
    category: selectedCategory,
    sort: sortOrder,
  });

  const products = useMemo(
    () =>
      filterProducts(allProducts, {
        q: appliedQuery,
        category: selectedCategory,
        sort: sortOrder,
      }),
    [allProducts, appliedQuery, selectedCategory, sortOrder],
  );

  const totalProductsCount = allProducts.length;
  const currentSearchParamsValue = searchParams.toString();

  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  }, [setSearchParams]);

  useEffect(() => {
    const normalizedSearchParams = serializeProductsSearchParams({
      q: appliedQuery,
      category: selectedCategory,
      sort: sortOrder,
    });

    if (normalizedSearchParams.toString() !== currentSearchParamsValue) {
      setSearchParamsRef.current(normalizedSearchParams, {
        replace: true,
      });
    }
  }, [appliedQuery, currentSearchParamsValue, selectedCategory, sortOrder]);

  useEffect(() => {
    appliedFiltersRef.current = {
      q: appliedQuery,
      category: selectedCategory,
      sort: sortOrder,
    };
  }, [appliedQuery, selectedCategory, sortOrder]);

  useEffect(() => {
    const expectedSearchEcho = pendingSearchEcho.current;

    pendingSearchEcho.current = null;

    if (expectedSearchEcho !== appliedQuery) {
      setSearchDraft(appliedQuery);
    }
  }, [appliedQuery]);

  useEffect(() => {
    const appliedFilters = appliedFiltersRef.current;
    const normalizedDebouncedQuery = debouncedSearchQuery.trim();

    if (normalizedDebouncedQuery !== appliedFilters.q) {
      const nextSearchParams = serializeProductsSearchParams({
        ...appliedFilters,
        q: normalizedDebouncedQuery,
      });

      pendingSearchEcho.current = normalizedDebouncedQuery;

      setSearchParamsRef.current(nextSearchParams, {
        replace: true,
      });
    }
  }, [debouncedSearchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchDraft(query);
  };

  const handleSearchClear = () => {
    setSearchDraft("");

    const nextSearchParams = serializeProductsSearchParams({
      q: "",
      category: selectedCategory,
      sort: sortOrder,
    });

    pendingSearchEcho.current = appliedQuery === "" ? null : "";

    setSearchParams(nextSearchParams, {
      replace: true,
    });
  };

  const handleCategoryChange = (category: string) => {
    const nextSearchParams = serializeProductsSearchParams({
      q: appliedQuery,
      category,
      sort: sortOrder,
    });

    setSearchParams(nextSearchParams);
  };

  const handleSortOrderChange = (newSortOrder: ProductSortOrder) => {
    const nextSearchParams = serializeProductsSearchParams({
      q: appliedQuery,
      category: selectedCategory,
      sort: newSortOrder,
    });

    setSearchParams(nextSearchParams);
  };

  const handleClearFilters = () => {
    setSearchDraft("");

    const nextSearchParams = serializeProductsSearchParams({
      q: "",
      category: "",
      sort: ProductSortOrder.Default,
    });

    pendingSearchEcho.current = appliedQuery === "" ? null : "";

    setSearchParams(nextSearchParams);
  };

  const hasActiveFilters =
    searchDraft.trim().length > 0 ||
    selectedCategory !== "" ||
    sortOrder !== ProductSortOrder.Default;

  return {
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
  };
}
