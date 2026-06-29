import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearProductFilters,
  selectCategories,
  selectFilteredProducts,
  selectProducts,
  selectSearchQuery,
  selectSelectedCategory,
  selectSortOrder,
  setSearchQuery,
  setSelectedCategory,
  setSortOrder,
} from "../../features/products/productsSlice";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { ProductSortOrder } from "../../types/product";

export function useProductsFilters() {
  const dispatch = useAppDispatch();

  const products = useAppSelector(selectFilteredProducts);
  const totalProductsCount = useAppSelector(selectProducts).length;
  const categories = useAppSelector(selectCategories);
  const searchQuery = useAppSelector(selectSearchQuery);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const sortOrder = useAppSelector(selectSortOrder);

  const [searchDraft, setSearchDraft] = useState(searchQuery);

  const debouncedSearchQuery = useDebouncedValue(searchDraft);

  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      dispatch(setSearchQuery(debouncedSearchQuery));
    }
  }, [debouncedSearchQuery, dispatch, searchQuery]);

  const handleSearchChange = (query: string) => {
    setSearchDraft(query);
  };

  const handleSearchClear = () => {
    setSearchDraft("");
    dispatch(setSearchQuery(""));
  };

  const handleCategoryChange = (category: string) => {
    dispatch(setSelectedCategory(category));
  };

  const handleSortOrderChange = (newSortOrder: ProductSortOrder) => {
    dispatch(setSortOrder(newSortOrder));
  };

  const handleClearFilters = () => {
    setSearchDraft("");
    dispatch(clearProductFilters());
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
