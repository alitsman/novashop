import { ProductSortOrder } from "../../types/product";
import type { ProductFilters } from "./filterProducts";

type ParseProductsSearchParamsOptions = {
  categories: string[];
  shouldValidateCategory: boolean;
};

export function parseProductsSearchParams(
  searchParams: URLSearchParams,
  options: ParseProductsSearchParamsOptions,
): ProductFilters {
  const queryFromUrl = searchParams.get("q");
  const categoryFromUrl = searchParams.get("category");
  const sortFromUrl = searchParams.get("sort");

  let q = "";
  let category = "";
  let sort: ProductSortOrder = ProductSortOrder.Default;

  if (queryFromUrl !== null) {
    q = queryFromUrl.trim();
  }

  if (categoryFromUrl !== null) {
    category = categoryFromUrl;
  }

  if (options.shouldValidateCategory && category !== "" && !options.categories.includes(category)) {
    category = "";
  }

  if (sortFromUrl === ProductSortOrder.PriceAsc) {
    sort = ProductSortOrder.PriceAsc;
  } else if (sortFromUrl === ProductSortOrder.PriceDesc) {
    sort = ProductSortOrder.PriceDesc;
  }

  return {
    q,
    category,
    sort,
  };
}

export function serializeProductsSearchParams(filters: ProductFilters): URLSearchParams {
  const searchParams = new URLSearchParams();
  const normalizedQuery = filters.q.trim();

  if (normalizedQuery !== "") {
    searchParams.set("q", normalizedQuery);
  }

  if (filters.category !== "") {
    searchParams.set("category", filters.category);
  }

  if (filters.sort !== ProductSortOrder.Default) {
    searchParams.set("sort", filters.sort);
  }

  return searchParams;
}
