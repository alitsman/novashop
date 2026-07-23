import { ProductSortOrder } from "../../../types/product";
import { Button, ButtonVariant } from "../../common/button";
import { SearchField } from "../../common/search-field";
import { SelectField } from "../../common/select-field";
import "./products-filters.css";

type ProductsFiltersProps = {
  categories: string[];
  searchValue: string;
  selectedCategory: string;
  sortOrder: ProductSortOrder;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  onCategoryChange: (category: string) => void;
  onSortOrderChange: (sortOrder: ProductSortOrder) => void;
  onClearFilters: () => void;
};

export function ProductsFilters({
  categories,
  searchValue,
  selectedCategory,
  sortOrder,
  hasActiveFilters,
  onSearchChange,
  onSearchClear,
  onCategoryChange,
  onSortOrderChange,
  onClearFilters,
}: ProductsFiltersProps) {
  return (
    <section className="products-filters" aria-label="Find products">
      <SearchField
        id="products-search"
        label="Search products by name"
        value={searchValue}
        placeholder="Search products"
        onChange={onSearchChange}
        onClear={onSearchClear}
      />

      <div className="products-filters__actions">
        <SelectField
          id="products-category"
          name="category"
          label="Filter by category"
          value={selectedCategory}
          onChange={onCategoryChange}
        >
          <option value="">All categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </SelectField>

        <SelectField
          id="products-sort-order"
          name="sortOrder"
          label="Sort products by price"
          value={sortOrder}
          onChange={(value) => {
            onSortOrderChange(value as ProductSortOrder);
          }}
        >
          <option value={ProductSortOrder.Default}>Default order</option>
          <option value={ProductSortOrder.PriceAsc}>Price: low to high</option>
          <option value={ProductSortOrder.PriceDesc}>Price: high to low</option>
        </SelectField>

        <Button
          className="products-filters__clear-button"
          variant={ButtonVariant.Secondary}
          disabled={!hasActiveFilters}
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      </div>
    </section>
  );
}
