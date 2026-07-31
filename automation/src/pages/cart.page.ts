import type { Locator, Page } from "@playwright/test";
import { HeaderComponent } from "../components/header.component";
import { CartItemComponent } from "../components/cart-item.component";

export class CartPage {
  private readonly page: Page;
  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly emptyCartTitle: Locator;
  readonly goToProductsLink: Locator;
  readonly continueShoppingLink: Locator;
  readonly cartItemsList: Locator;
  readonly orderSummaryBlock: Locator;
  readonly summaryText: Locator;
  readonly summaryTotal: Locator;
  readonly goToCheckoutButton: Locator;
  readonly checkoutError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);

    this.heading = this.page.getByRole("heading", {
      name: "Cart",
      level: 1,
      exact: true,
    });

    this.emptyCartTitle = this.page.getByRole("heading", {
      name: "Your cart is empty",
      exact: true,
      level: 2,
    });

    this.goToProductsLink = this.page.getByRole("link", {
      name: "Go to products",
      exact: true,
    });

    this.continueShoppingLink = this.page.getByRole("link", {
      name: "Continue shopping",
      exact: true,
    });

    this.cartItemsList = this.page.getByRole("list", {
      name: "Cart items",
      exact: true,
    });

    this.orderSummaryBlock = this.page.getByRole("complementary", {
      name: "Order summary",
      exact: true,
    });

    this.summaryText = this.orderSummaryBlock.getByTestId(
      "cart-summary-quantity",
    );

    this.summaryTotal = this.orderSummaryBlock.getByRole("status");

    this.goToCheckoutButton = this.orderSummaryBlock.getByRole("button", {
      name: "Go to checkout",
      exact: true,
    });

    this.checkoutError = this.orderSummaryBlock.getByRole("alert");
  }

  getCartItem(title: string): CartItemComponent {
    const root = this.cartItemsList.getByRole("article", {
      name: title,
      exact: true,
    });
    return new CartItemComponent(root);
  }
}
