import type { Locator, Page } from "@playwright/test";

import { HeaderComponent } from "../components";

export class CheckoutPage {
  private readonly page: Page;

  readonly root: Locator;
  readonly header: HeaderComponent;

  readonly heading: Locator;
  readonly emptyCartTitle: Locator;
  readonly goToProductsLink: Locator;
  readonly backToCartLink: Locator;

  readonly orderSummaryBlock: Locator;
  readonly orderItemsList: Locator;
  readonly orderItems: Locator;
  readonly summaryQuantity: Locator;
  readonly summaryTotal: Locator;

  readonly form: Locator;
  readonly fullNameInput: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly deliveryMethodSelect: Locator;
  readonly paymentMethodSelect: Locator;

  readonly formError: Locator;

  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("region", {
      name: "Checkout",
      exact: true,
    });

    this.header = new HeaderComponent(this.page);

    this.heading = this.root.getByRole("heading", {
      name: "Checkout",
      level: 1,
      exact: true,
    });

    this.emptyCartTitle = this.root.getByRole("heading", {
      name: "Your cart is empty",
      level: 2,
      exact: true,
    });

    this.goToProductsLink = this.root.getByRole("link", {
      name: "Go to products",
      exact: true,
    });

    this.backToCartLink = this.root.getByRole("link", {
      name: "Back to cart",
      exact: true,
    });

    this.orderSummaryBlock = this.root.getByRole("complementary", {
      name: "Order summary",
      exact: true,
    });

    this.orderItemsList = this.orderSummaryBlock.getByRole("list", {
      name: "Order items",
      exact: true,
    });

    this.orderItems = this.orderItemsList.getByRole("listitem");

    // The quantity text has no semantic role or stable attribute,
    // so scope its structural locator to the order summary.
    this.summaryQuantity = this.orderSummaryBlock.locator(".checkout-page__summary-quantity");

    this.summaryTotal = this.orderSummaryBlock.getByRole("status").filter({
      hasText: /^Total: \$/,
    });

    this.form = this.root.getByRole("form", {
      name: "Checkout form",
      exact: true,
    });

    this.fullNameInput = this.form.getByLabel("Full name");
    this.phoneInput = this.form.getByLabel("Phone");
    this.addressInput = this.form.getByLabel("Delivery address");

    this.deliveryMethodSelect = this.form.getByLabel("Delivery method", {
      exact: true,
    });

    this.paymentMethodSelect = this.form.getByLabel("Payment method", {
      exact: true,
    });

    // The markup provides no semantic container that separates the form-level
    // alert from field alerts, so scope it to the form footer structurally.
    this.formError = this.form.locator(".checkout-form__footer").getByRole("alert");

    // The submit label changes between states, so match the button by its type
    // instead of an accessible name.
    this.submitButton = this.form.locator('button[type="submit"]');
  }

  async open(): Promise<void> {
    await this.page.goto("/checkout");
  }

  getOrderItem(title: string): Locator {
    const itemTitle = this.page.getByRole("heading", {
      name: title,
      level: 3,
      exact: true,
    });

    return this.orderItems.filter({
      has: itemTitle,
    });
  }

  getOrderItemTotal(title: string): Locator {
    return this.getOrderItem(title).getByTestId("item-total");
  }
}
