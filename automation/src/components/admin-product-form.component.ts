import type { Locator } from "@playwright/test";

export class AdminProductFormComponent {
  private readonly root: Locator;

  readonly titleInput: Locator;
  readonly priceInput: Locator;
  readonly stockInput: Locator;
  readonly categoryInput: Locator;
  readonly imageUrlInput: Locator;
  readonly descriptionInput: Locator;

  readonly formError: Locator;

  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(root: Locator) {
    this.root = root;

    this.titleInput = this.root.getByRole("textbox", {
      name: "Product title",
      exact: true,
    });

    this.priceInput = this.root.getByRole("spinbutton", {
      name: "Price",
      exact: true,
    });

    this.stockInput = this.root.getByRole("spinbutton", {
      name: "Stock",
      exact: true,
    });

    this.categoryInput = this.root.getByRole("textbox", {
      name: "Category",
      exact: true,
    });

    this.imageUrlInput = this.root.getByRole("textbox", {
      name: "Image URL",
      exact: true,
    });

    this.descriptionInput = this.root.getByRole("textbox", {
      name: "Description",
      exact: true,
    });

    // The markup provides no semantic container that separates the form-level
    // alert from field alerts, so scope it to the form footer structurally.
    this.formError = this.root.locator(".admin-product-form__footer").getByRole("alert");

    // The submit label changes between states, so match the button by its type
    // instead of an accessible name.
    this.submitButton = this.root.locator('button[type="submit"]');

    this.cancelButton = this.root.getByRole("button", {
      name: "Cancel",
      exact: true,
    });
  }
}
