import type { Locator, Page } from "@playwright/test";
import { ProductCardComponent } from "../components/product-card.component";
import { HeaderComponent } from "../components/header.component";

export class ProductCatalogPage {
  private readonly page: Page;

  readonly searchInput: Locator;
  readonly header: HeaderComponent;
  private readonly productList: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.getByRole("searchbox", {
      name: "Search products by name",
    });
    this.productList = page.getByRole("list", {
      name: "Products list",
    });
    this.productCards = this.productList.getByRole("article");
    this.header = new HeaderComponent(page);
  }

  async open(): Promise<void> {
    await this.page.goto("/products");
  }

  async searchFor(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  getProductCard(title: string): ProductCardComponent {
    const root = this.productList.getByRole("article", {
      name: title,
      exact: true,
    });

    return new ProductCardComponent(root);
  }
}
