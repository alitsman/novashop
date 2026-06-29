import noProductsFoundImage from "../../assets/no_products_found.png";
import { EmptyState } from "../../components/common/empty-state";
import { ErrorState } from "../../components/common/error-state";
import { Loader } from "../../components/common/loader";
import { ProductCard } from "../../components/products";
import { ProductsFilters } from "../../components/products/products-filters";
import type { Product, ProductSortOrder } from "../../types/product";
import "./products-page.css";

type ProductsPageViewProps = {
  products: Product[];
  shouldShowFilters: boolean;
  isCatalogEmpty: boolean;
  isFilteredEmpty: boolean;
  categories: string[];
  searchValue: string;
  selectedCategory: string;
  sortOrder: ProductSortOrder;
  hasActiveFilters: boolean;
  loadingMessage: string | null;
  errorMessage: string | null;
  resultsMessage: string | null;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onCategoryChange: (category: string) => void;
  onSortOrderChange: (sortOrder: ProductSortOrder) => void;
  onClearFilters: () => void;
};

export function ProductsPageView({
  products,
  shouldShowFilters,
  isCatalogEmpty,
  isFilteredEmpty,
  categories,
  searchValue,
  selectedCategory,
  sortOrder,
  hasActiveFilters,
  loadingMessage,
  errorMessage,
  resultsMessage,
  onSearchChange,
  onSearchClear,
  onCategoryChange,
  onSortOrderChange,
  onClearFilters,
}: ProductsPageViewProps) {
  return (
    <section className="products-page" aria-labelledby="products-title">
      <h1 className="products-page__title" id="products-title">
        Products
      </h1>

      {shouldShowFilters && (
        <ProductsFilters
          categories={categories}
          searchValue={searchValue}
          selectedCategory={selectedCategory}
          sortOrder={sortOrder}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={onSearchChange}
          onSearchClear={onSearchClear}
          onCategoryChange={onCategoryChange}
          onSortOrderChange={onSortOrderChange}
          onClearFilters={onClearFilters}
        />
      )}

      {loadingMessage && (
        <div className="products-page__loading">
          <Loader message={loadingMessage} />
        </div>
      )}

      {errorMessage && (
        <ErrorState
          title="Failed to load products."
          description={errorMessage}
        />
      )}

      {resultsMessage && (
        <p className="products-page__status" aria-live="polite">
          {resultsMessage}
        </p>
      )}

      {isCatalogEmpty && (
        <div aria-live="polite">
          <EmptyState
            imageSrc={noProductsFoundImage}
            title="No products available."
            description="The catalog is empty right now. Please check back later."
          />
        </div>
      )}

      {isFilteredEmpty && (
        <div aria-live="polite">
          <EmptyState
            imageSrc={noProductsFoundImage}
            title="No products found."
            description="Try changing your search term, category, or sorting option."
          />
        </div>
      )}

      {products.length > 0 && (
        <ul className="products-page__list" aria-label="Products list">
          {products.map((product) => (
            <li className="products-page__item" key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
