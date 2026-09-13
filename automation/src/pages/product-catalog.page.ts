import type { Locator, Page } from "@playwright/test";
import { HeaderComponent, ProductCardComponent } from "../components";

export class ProductCatalogPage {
  private readonly page: Page;

  readonly root: Locator;
  readonly heading: Locator;
  readonly loadingStatus: Locator;
  readonly errorAlert: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly categorySelect: Locator;
  readonly categoryOptions: Locator;
  readonly sortSelect: Locator;
  readonly clearFiltersButton: Locator;
  readonly productsStatus: Locator;
  readonly noResultsTitle: Locator;
  readonly noResultsDescription: Locator;
  readonly emptyCatalogTitle: Locator;
  readonly emptyCatalogDescription: Locator;
  readonly header: HeaderComponent;
  readonly productList: Locator;
  readonly productCards: Locator;
  readonly productTitles: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("region", {
      name: "Products",
      exact: true,
    });

    this.heading = this.root.getByRole("heading", {
      name: "Products",
      level: 1,
      exact: true,
    });

    // The Loader has no accessible name, so match its text instead of a role name.
    // The anchored pattern also excludes the always-present results status element.
    this.loadingStatus = this.root.getByRole("status").filter({
      hasText: /^Loading products\.\.\.$/,
    });

    // Alerts do not derive an accessible name from their content,
    // so identify the catalog error by its visible title text.
    this.errorAlert = this.root.getByRole("alert").filter({
      hasText: /^Failed to load products\./,
    });

    this.searchInput = this.root.getByRole("searchbox", {
      name: "Search products by name",
      exact: true,
    });

    this.clearSearchButton = this.root.getByRole("button", {
      name: "Clear search",
      exact: true,
    });

    this.categorySelect = this.root.getByLabel("Filter by category", {
      exact: true,
    });
    this.categoryOptions = this.categorySelect.locator("option");

    this.sortSelect = this.root.getByLabel("Sort products by price", {
      exact: true,
    });

    this.clearFiltersButton = this.root.getByRole("button", {
      name: "Clear filters",
      exact: true,
    });

    this.productsStatus = this.root.getByTestId("products-status");

    this.noResultsTitle = this.root.getByRole("heading", {
      name: "No products found.",
      exact: true,
    });
    this.noResultsDescription = this.root.getByText(
      "Try changing your search term, category, or sorting option.",
      {
        exact: true,
      },
    );

    this.emptyCatalogTitle = this.root.getByRole("heading", {
      name: "No products available.",
      exact: true,
    });
    this.emptyCatalogDescription = this.root.getByText(
      "The catalog is empty right now. Please check back later.",
      {
        exact: true,
      },
    );

    this.header = new HeaderComponent(this.page);

    this.productList = this.root.getByRole("list", {
      name: "Products list",
      exact: true,
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
