import type { Locator } from "@playwright/test";
import { pasteText } from "../helpers/clipboard.helper";
type QuantityArrowKey = "ArrowUp" | "ArrowDown";
export class ProductCardComponent {
  private readonly root: Locator;
  private readonly addToCartControls: Locator;

  readonly title: Locator;
  readonly category: Locator;
  readonly description: Locator;
  readonly price: Locator;

  readonly availability: Locator;
  readonly quantityInput: Locator;
  readonly decreaseButton: Locator;
  readonly increaseButton: Locator;
  readonly quantityError: Locator;
  readonly cartError: Locator;
  readonly quantityHint: Locator;
  readonly addToCartButton: Locator;
  readonly detailsLink: Locator;

  constructor(root: Locator) {
    this.root = root;
    this.addToCartControls = this.root.getByRole("group");

    this.title = this.root.getByRole("heading", { level: 2 });
    this.category = this.root.getByTestId("product-category");
    this.description = this.root.getByTestId("product-description");
    this.price = this.root.getByTestId("product-price");

    this.availability = this.addToCartControls.getByTestId(
      "product-availability",
    );
    this.quantityInput = this.addToCartControls.getByRole("spinbutton");
    this.decreaseButton = this.addToCartControls.getByRole("button", {
      name: /^Decrease quantity for /,
    });
    this.increaseButton = this.addToCartControls.getByRole("button", {
      name: /^Increase quantity for /,
    });
    this.quantityError = this.addToCartControls.getByTestId(
      "product-quantity-error",
    );
    this.cartError = this.addToCartControls.getByTestId("add-to-cart-error");
    this.quantityHint = this.addToCartControls.getByTestId(
      "product-quantity-hint",
    );
    this.addToCartButton =
      this.addToCartControls.getByTestId("add-to-cart-submit");
    this.detailsLink = this.root.getByRole("link", {
      name: /^View details for /,
    });
  }

  async increaseQuantity(count = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.increaseButton.click();
    }
  }

  async decreaseQuantity(count = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.decreaseButton.click();
    }
  }

  async fillQuantity(amount: string): Promise<void> {
    await this.quantityInput.fill(amount);
  }

  async pressQuantityKey(key: QuantityArrowKey, count = 1): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.quantityInput.press(key);
    }
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async openDetails(): Promise<void> {
    await this.detailsLink.click();
  }

  async pasteQuantity(text: string): Promise<void> {
    await pasteText(this.quantityInput, text);
  }
}
