import type { Locator } from "@playwright/test";
import { pasteText } from "../helpers";

type QuantityArrowKey = "ArrowUp" | "ArrowDown";
export class AddToCartControlComponent {
  private readonly root: Locator;

  readonly productAvailability: Locator;
  readonly available: Locator;
  readonly inCart: Locator;
  readonly quantityInput: Locator;
  readonly decreaseButton: Locator;
  readonly increaseButton: Locator;
  readonly quantityError: Locator;
  readonly cartError: Locator;
  readonly quantityHint: Locator;
  readonly addToCartButton: Locator;

  constructor(root: Locator) {
    this.root = root;

    this.productAvailability = this.root.getByTestId("product-availability");
    this.available = this.productAvailability.getByText(/^Available:/);
    this.inCart = this.productAvailability.getByText(/^In cart:/);

    this.quantityInput = this.root.getByRole("spinbutton", {
      name: /^Quantity for /,
    });
    this.decreaseButton = this.root.getByRole("button", {
      name: /^Decrease quantity for /,
    });
    this.increaseButton = this.root.getByRole("button", {
      name: /^Increase quantity for /,
    });
    this.quantityError = this.root.getByTestId("product-quantity-error");
    this.cartError = this.root.getByTestId("add-to-cart-error");
    this.quantityHint = this.root.getByTestId("product-quantity-hint");
    this.addToCartButton = this.root.getByTestId("add-to-cart-submit");
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

  async submit(): Promise<void> {
    await this.addToCartButton.click();
  }

  async pasteQuantity(text: string): Promise<void> {
    await pasteText(this.quantityInput, text);
  }
}
