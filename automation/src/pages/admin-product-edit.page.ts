import type { Locator, Page } from "@playwright/test";

import {
  AdminProductFormComponent,
  AdminProductPreviewComponent,
  ConfirmDialogComponent,
} from "../components";

export class AdminProductEditPage {
  private readonly page: Page;

  readonly root: Locator;
  readonly heading: Locator;
  readonly loadingStatus: Locator;

  readonly notFoundTitle: Locator;
  readonly notFoundDescription: Locator;
  readonly loadErrorAlert: Locator;
  readonly backToAdminProductsLink: Locator;

  readonly form: AdminProductFormComponent;
  readonly preview: AdminProductPreviewComponent;

  readonly deleteSection: Locator;
  readonly deleteButton: Locator;
  readonly deleteDialog: ConfirmDialogComponent;

  constructor(page: Page) {
    this.page = page;

    this.root = this.page.getByRole("region", {
      name: "Edit product",
      exact: true,
    });

    this.heading = this.root.getByRole("heading", {
      name: "Edit product",
      level: 1,
      exact: true,
    });

    this.loadingStatus = this.root.getByRole("status").filter({
      hasText: /^Loading product\.\.\.$/,
    });

    this.notFoundTitle = this.root.getByRole("heading", {
      name: "Product not found",
      level: 2,
      exact: true,
    });

    this.notFoundDescription = this.root.getByText(
      "The product may have been removed or the link may be incorrect.",
      {
        exact: true,
      },
    );

    const loadErrorTitle = this.page.getByRole("heading", {
      name: "Failed to load product",
      level: 2,
      exact: true,
    });

    this.loadErrorAlert = this.root.getByRole("alert").filter({
      has: loadErrorTitle,
    });

    this.backToAdminProductsLink = this.root.getByRole("link", {
      name: "Back to admin products",
      exact: true,
    });

    const formRoot = this.root.getByRole("form", {
      name: "Edit product form",
      exact: true,
    });

    this.form = new AdminProductFormComponent(formRoot);

    const previewRoot = this.root.getByRole("region", {
      name: "Product card preview",
      exact: true,
    });

    this.preview = new AdminProductPreviewComponent(previewRoot);

    this.deleteSection = this.root.getByRole("region", {
      name: "Delete product",
      exact: true,
    });

    this.deleteButton = this.deleteSection.getByRole("button", {
      name: "Delete product",
      exact: true,
    });

    const deleteDialogRoot = this.page.getByRole("dialog", {
      name: "Delete product?",
      exact: true,
    });

    this.deleteDialog = new ConfirmDialogComponent(deleteDialogRoot, {
      confirmLabel: "Delete product",
      cancelLabel: "Cancel",
    });
  }

  async open(productId: string): Promise<void> {
    await this.page.goto(`/admin/products/${productId}/edit`);
  }
}
