import type { Locator, Page } from "@playwright/test";
import {
  CartItemComponent,
  ConfirmDialogComponent,
  HeaderComponent,
} from "../components";

export class CartPage {
  private readonly page: Page;

  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly emptyCartTitle: Locator;
  readonly goToProductsLink: Locator;
  readonly continueShoppingLink: Locator;

  readonly cartItemsList: Locator;
  readonly cartItemTitles: Locator;
  readonly cartItems: Locator;

  readonly orderSummaryBlock: Locator;
  readonly summaryQuantity: Locator;
  readonly summaryTotal: Locator;
  readonly goToCheckoutButton: Locator;
  readonly checkoutError: Locator;

  readonly removeItemDialog: ConfirmDialogComponent;

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
      level: 2,
      exact: true,
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

    this.cartItemTitles = this.cartItemsList.getByRole("heading", { level: 2 });

    this.cartItems = this.cartItemsList.getByRole("listitem");

    this.orderSummaryBlock = this.page.getByRole("complementary", {
      name: "Order summary",
      exact: true,
    });

    this.summaryQuantity = this.orderSummaryBlock.getByTestId(
      "cart-summary-quantity",
    );

    this.summaryTotal = this.orderSummaryBlock.getByRole("status");

    this.goToCheckoutButton = this.orderSummaryBlock.getByRole("button", {
      name: "Go to checkout",
      exact: true,
    });

    this.checkoutError = this.orderSummaryBlock.getByRole("alert");

    const removeItemDialogRoot = this.page.getByRole("dialog", {
      name: "Remove item from cart?",
      exact: true,
    });

    this.removeItemDialog = new ConfirmDialogComponent(removeItemDialogRoot, {
      confirmLabel: "Remove item",
      cancelLabel: "Cancel",
    });
  }

  async open(): Promise<void> {
    await this.page.goto("/cart");
  }

  getCartItem(title: string): CartItemComponent {
    const root = this.cartItemsList.getByRole("article", {
      name: title,
      exact: true,
    });

    return new CartItemComponent(root);
  }
}
