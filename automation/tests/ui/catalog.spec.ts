import { test, expect } from "@playwright/test";
import { ProductCatalogPage } from "../../src/pages/product-catalog.page";
import { authenticateAsRegularUser } from "../../src/helpers/auth.helper";
import { prepareProductCatalog } from "../../src/helpers/product-catalog.helper";
import { CATALOG_PRODUCTS } from "../../src/test-data/product-catalog.data";
import { createProduct } from "../../src/test-data/product.factory";

test.describe("product catalog", () => {
  let catalogPage: ProductCatalogPage;

  test.beforeEach(async ({ page }) => {
    await authenticateAsRegularUser(page);

    const products = CATALOG_PRODUCTS.map((product) => createProduct(product));

    await prepareProductCatalog(page, products);

    catalogPage = new ProductCatalogPage(page);
    await catalogPage.open();

    await expect(
      catalogPage.header.currentUserName,
      "Regular user session should be restored",
    ).toHaveText("Regular User");
  });

  // test.fixme("available products: displays the complete catalog", async () => {
  //   // Verify that the catalog is loaded and all expected products are displayed.
  // });

  // test.fixme("search by name: shows only matching products", async () => {
  //   // Enter a query that matches multiple products.
  //   // Verify that every remaining product name matches the query.
  //   // Clear the search and verify that the complete catalog is restored.
  // });

  // test.fixme("unmatched search: shows the no-results state", async () => {
  //   // Enter a query that does not match any product.
  //   // Verify that no product cards are displayed.
  //   // Verify that the "No products found." message is displayed.
  // });

  // test.fixme("category filter: shows only products from the selected category", async () => {
  //   // Select a product category.
  //   // Verify that every displayed product belongs to the selected category.
  // });

  // test.fixme("price sorting: orders products in both directions and restores the default order", async () => {
  //   // Sort products by price from low to high.
  //   // Sort products by price from high to low.
  //   // Restore and verify the default product order.
  // });

  // test.fixme("clear filters: resets search, category, and sorting", async () => {
  //   // Apply search, category, and sorting filters together.
  //   // Clear all filters.
  //   // Verify that every control is reset and the complete catalog is restored.
  // });
});
