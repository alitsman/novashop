import { ProductSortOrder, type Product } from "../../types/product";

export type ProductFilters = {
  q: string;
  category: string;
  sort: ProductSortOrder;
};

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const normalizedQuery = filters.q.trim().toLowerCase();
  const filteredProducts: Product[] = [];

  for (const product of products) {
    const matchesSearchQuery = product.title.toLowerCase().includes(normalizedQuery);

    const matchesSelectedCategory =
      filters.category === "" || product.category === filters.category;

    if (matchesSearchQuery && matchesSelectedCategory) {
      filteredProducts.push(product);
    }
  }

  if (filters.sort === ProductSortOrder.PriceAsc) {
    filteredProducts.sort(
      (firstProduct, secondProduct) => firstProduct.price - secondProduct.price,
    );
  } else if (filters.sort === ProductSortOrder.PriceDesc) {
    filteredProducts.sort(
      (firstProduct, secondProduct) => secondProduct.price - firstProduct.price,
    );
  }

  return filteredProducts;
}
