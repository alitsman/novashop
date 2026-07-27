import type { Locator, Page } from "@playwright/test";
import { ProductCardComponent } from "../components/product-card.component";
import { HeaderComponent } from "../components/header.component";

export class ProductCatalogPage {
  private readonly page: Page;

  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly categorySelect: Locator;
  readonly sortSelect: Locator;
  readonly clearFiltersButton: Locator;
  readonly productsStatus: Locator;
  readonly noResultsTitle: Locator;
  readonly emptyCatalogTitle: Locator;
  readonly header: HeaderComponent;
  private readonly productList: Locator;
  readonly productCards: Locator;
  readonly productTitles: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.getByRole("searchbox", {
      name: "Search products by name",
    });
    this.clearSearchButton = page.getByRole("button", {
      name: "Clear search",
      exact: true,
    });
    this.categorySelect = page.getByLabel("Filter by category");
    this.sortSelect = page.getByLabel("Sort products by price");
    this.clearFiltersButton = page.getByRole("button", {
      name: "Clear filters",
      exact: true,
    });
    this.productsStatus = page.getByTestId("products-status");
    this.noResultsTitle = page.getByRole("heading", {
      name: "No products found.",
      exact: true,
    });
    this.emptyCatalogTitle = page.getByRole("heading", {
      name: "No products available.",
      exact: true,
    });
    this.header = new HeaderComponent(page);
    this.productList = page.getByRole("list", {
      name: "Products list",
    });
    this.productCards = this.productList.getByRole("article");
    this.productTitles = this.productCards.getByRole("heading", { level: 2 });
  }

  async open(): Promise<void> {
    await this.page.goto("/products");
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async filterByCategory(option: string): Promise<void> {
    await this.categorySelect.selectOption(option);
  }

  async sortByPrice(option: string): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  getProductCard(title: string): ProductCardComponent {
    const root = this.productList.getByRole("article", {
      name: title,
      exact: true,
    });
    return new ProductCardComponent(root);
  }
}
