import type { Locator } from "@playwright/test";

type ConfirmDialogComponentOptions = {
  confirmLabel: string;
  cancelLabel: string;
};

export class ConfirmDialogComponent {
  readonly root: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(root: Locator, options: ConfirmDialogComponentOptions) {
    this.root = root;

    this.confirmButton = this.root.getByRole("button", {
      name: options.confirmLabel,
      exact: true,
    });

    this.cancelButton = this.root.getByRole("button", {
      name: options.cancelLabel,
      exact: true,
    });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
