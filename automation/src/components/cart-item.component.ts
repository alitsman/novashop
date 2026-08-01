import type { Locator } from "@playwright/test";
import { pasteText } from "../helpers";

type QuantityArrowKey = "ArrowUp" | "ArrowDown";

export class CartItemComponent {
  private readonly root: Locator;

  readonly title: Locator;
  readonly price: Locator;

  readonly quantityInput: Locator;
  readonly decreaseButton: Locator;
  readonly increaseButton: Locator;
  readonly quantityHint: Locator;
  readonly quantityError: Locator;

  readonly itemTotal: Locator;
  readonly removeButton: Locator;

  constructor(root: Locator) {
    this.root = root;

    this.title = this.root.getByRole("heading", { level: 2 });
    this.price = this.root.getByText(/^Price: \$/);

    this.quantityInput = this.root.getByRole("spinbutton", {
      name: /^Quantity for /,
    });
    this.decreaseButton = this.root.getByRole("button", {
      name: /^Decrease quantity for /,
    });
    this.increaseButton = this.root.getByRole("button", {
      name: /^Increase quantity for /,
    });
    this.quantityHint = this.root.getByTestId("cart-quantity-hint");
    this.quantityError = this.root.getByRole("alert");

    this.itemTotal = this.root.getByTestId("item-total");
    this.removeButton = this.root.getByRole("button", {
      name: /^Remove /,
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

  async pasteQuantity(text: string): Promise<void> {
    await pasteText(this.quantityInput, text);
  }
}
