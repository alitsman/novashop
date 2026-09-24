import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { prepareMockedAuthenticatedSession } from "../../src/helpers";
import { AdminProductCreatePage } from "../../src/pages";
import {
  ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE,
  ADMIN_PRODUCT_VALID_INPUT,
  ADMIN_USER,
} from "../../src/test-data";

const PRODUCTS_API_URL = new URL("/products", apiUrl).toString();

const PRICE_HINT = "Use a positive number, for example 29.99.";
const STOCK_HINT = "Use a whole number. Zero means out of stock.";
const IMAGE_URL_HINT = "Use an http or https image URL.";

const VALID_FORM_VALUES = {
  title: ADMIN_PRODUCT_VALID_INPUT.title,
  price: String(ADMIN_PRODUCT_VALID_INPUT.price),
  stock: String(ADMIN_PRODUCT_VALID_INPUT.stock),
  category: ADMIN_PRODUCT_VALID_INPUT.category,
  imageUrl: ADMIN_PRODUCT_VALID_INPUT.imageUrl,
  description: ADMIN_PRODUCT_VALID_INPUT.description,
};

const invalidTitleCases = [
  {
    name: "with hidden control characters",
    // U+0001 is a disallowed control character.
    value: "A\u0001",
    error: "Remove hidden control characters from product title.",
  },
  {
    name: "with angle brackets",
    value: "A>",
    error: "Remove angle brackets (< >) from product title.",
  },
  {
    name: "shorter than 2 characters",
    value: "A",
    error: "Product title must be at least 2 characters.",
  },
  {
    name: "longer than 80 characters",
    value: "A".repeat(81),
    error: "Product title must be 80 characters or less.",
  },
  {
    name: "without a letter or digit",
    value: "--",
    error: "Product title must contain at least one letter or digit.",
  },
];

const validTitleCases = [
  {
    name: "at the minimum length",
    value: "AB",
  },
  {
    name: "at the maximum length",
    value: "A".repeat(80),
  },
];

const invalidPriceCases = [
  {
    name: "that is not greater than 0",
    value: "0",
    error: "Price must be greater than 0.",
  },
  {
    name: "greater than 999999",
    value: "999999.01",
    error: "Price must be 999999 or less.",
  },
  {
    name: "with more than 2 decimal places",
    value: "1.234",
    error: "Price can have at most 2 decimal places.",
  },
];

const validPriceCases = [
  {
    name: "at the minimum with 2 decimal places",
    value: "0.01",
  },
  {
    name: "at the maximum",
    value: "999999",
  },
];

const invalidStockCases = [
  {
    name: "that is not a whole number",
    value: "1.5",
    error: "Stock quantity must be a whole number.",
  },
  {
    name: "that is negative",
    value: "-1",
    error: "Stock quantity cannot be negative.",
  },
  {
    name: "greater than 100000",
    value: "100001",
    error: "Stock quantity must be 100000 or less.",
  },
];

const validStockCases = [
  {
    name: "at the minimum",
    value: "0",
  },
  {
    name: "at the maximum",
    value: "100000",
  },
];

const invalidCategoryCases = [
  {
    name: "with hidden control characters",
    // U+0001 is a disallowed control character.
    value: "A\u0001",
    error: "Remove hidden control characters from category.",
  },
  {
    name: "with angle brackets",
    value: "A>",
    error: "Remove angle brackets (< >) from category.",
  },
  {
    name: "shorter than 2 characters",
    value: "A",
    error: "Category must be at least 2 characters.",
  },
  {
    name: "longer than 40 characters",
    value: "A".repeat(41),
    error: "Category must be 40 characters or less.",
  },
  {
    name: "without a letter or digit",
    value: "--",
    error: "Category must contain at least one letter or digit.",
  },
];

const validCategoryCases = [
  {
    name: "at the minimum length",
    value: "AB",
  },
  {
    name: "at the maximum length",
    value: "A".repeat(40),
  },
];

const invalidImageUrlCases = [
  {
    name: "that cannot be parsed as a URL",
    value: "not-a-url",
    error: "Image URL must be a valid http or https URL.",
  },
  {
    name: "with a disallowed protocol",
    // This is a valid URL, but its protocol is not allowed.
    value: "javascript:alert(1)",
    error: "Image URL must be a valid http or https URL.",
  },
];

const validImageUrlCases = [
  {
    name: "using http",
    value: "http://example.com/product.jpg",
  },
  {
    name: "using https",
    value: "https://example.com/product.jpg",
  },
];

const invalidDescriptionCases = [
  {
    name: "with hidden control characters",
    // U+0001 is a disallowed control character.
    value: "Valid text\u0001",
    error: "Remove hidden control characters from description.",
  },
  {
    name: "with angle brackets",
    value: "Valid text>",
    error: "Remove angle brackets (< >) from description.",
  },
  {
    name: "shorter than 10 characters",
    value: "123456789",
    error: "Description must be at least 10 characters.",
  },
  {
    name: "longer than 300 characters",
    value: "A".repeat(301),
    error: "Description must be 300 characters or less.",
  },
  {
    name: "without a letter or digit",
    value: "----------",
    error: "Description must contain at least one letter or digit.",
  },
];

const validDescriptionCases = [
  {
    name: "at the minimum length",
    value: "A".repeat(10),
  },
  {
    name: "at the maximum length",
    value: "A".repeat(300),
  },
];

test.describe("admin product form validation", () => {
  let adminProductCreatePage: AdminProductCreatePage;
  let createProductRequestCount: number;

  const fillProductForm = async (values: typeof VALID_FORM_VALUES) => {
    await adminProductCreatePage.form.titleInput.fill(values.title);
    await adminProductCreatePage.form.priceInput.fill(values.price);
    await adminProductCreatePage.form.stockInput.fill(values.stock);
    await adminProductCreatePage.form.categoryInput.fill(values.category);
    await adminProductCreatePage.form.imageUrlInput.fill(values.imageUrl);
    await adminProductCreatePage.form.descriptionInput.fill(values.description);
  };

  test.beforeEach(async ({ page }) => {
    createProductRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === PRODUCTS_API_URL && request.method() === "POST") {
        createProductRequestCount += 1;
      }
    });

    await prepareMockedAuthenticatedSession(page, ADMIN_USER.user);

    adminProductCreatePage = new AdminProductCreatePage(page);

    await adminProductCreatePage.open();
  });

  test("shows required-field errors and focuses the first remaining invalid field", async () => {
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.formError).toHaveText(
      "Please fix the highlighted fields before saving the product.",
    );

    await expect(adminProductCreatePage.form.titleInput).toHaveAccessibleDescription(
      "Product title is required.",
    );
    await expect(adminProductCreatePage.form.priceInput).toHaveAccessibleDescription(
      `${PRICE_HINT} Price is required.`,
    );
    await expect(adminProductCreatePage.form.stockInput).toHaveAccessibleDescription(
      `${STOCK_HINT} Stock quantity is required.`,
    );
    await expect(adminProductCreatePage.form.categoryInput).toHaveAccessibleDescription(
      "Category is required.",
    );
    await expect(adminProductCreatePage.form.imageUrlInput).toHaveAccessibleDescription(
      `${IMAGE_URL_HINT} Image URL is required.`,
    );
    await expect(adminProductCreatePage.form.descriptionInput).toHaveAccessibleDescription(
      "Description is required.",
    );

    await expect(adminProductCreatePage.form.titleInput).toBeFocused();

    await adminProductCreatePage.form.titleInput.fill(VALID_FORM_VALUES.title);
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.priceInput).toBeFocused();

    await adminProductCreatePage.form.priceInput.fill(VALID_FORM_VALUES.price);
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.stockInput).toBeFocused();

    await adminProductCreatePage.form.stockInput.fill(VALID_FORM_VALUES.stock);
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.categoryInput).toBeFocused();

    await adminProductCreatePage.form.categoryInput.fill(VALID_FORM_VALUES.category);
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.imageUrlInput).toBeFocused();

    await adminProductCreatePage.form.imageUrlInput.fill(VALID_FORM_VALUES.imageUrl);
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.descriptionInput).toBeFocused();

    expect(createProductRequestCount).toBe(0);
  });

  test("clears only the corrected field error after client validation", async () => {
    await adminProductCreatePage.form.submitButton.click();

    await expect(adminProductCreatePage.form.titleInput).toHaveAccessibleDescription(
      "Product title is required.",
    );
    await expect(adminProductCreatePage.form.priceInput).toHaveAccessibleDescription(
      `${PRICE_HINT} Price is required.`,
    );

    await adminProductCreatePage.form.titleInput.fill(VALID_FORM_VALUES.title);

    await expect(adminProductCreatePage.form.titleInput).toHaveAccessibleDescription("");
    await expect(adminProductCreatePage.form.titleInput).toHaveAttribute("aria-invalid", "false");

    await expect(adminProductCreatePage.form.priceInput).toHaveAccessibleDescription(
      `${PRICE_HINT} Price is required.`,
    );
    await expect(adminProductCreatePage.form.priceInput).toHaveAttribute("aria-invalid", "true");

    await expect(adminProductCreatePage.form.formError).toHaveText(
      "Please fix the highlighted fields before saving the product.",
    );

    await adminProductCreatePage.form.priceInput.fill(VALID_FORM_VALUES.price);
    await adminProductCreatePage.form.stockInput.fill(VALID_FORM_VALUES.stock);
    await adminProductCreatePage.form.categoryInput.fill(VALID_FORM_VALUES.category);
    await adminProductCreatePage.form.imageUrlInput.fill(VALID_FORM_VALUES.imageUrl);
    await adminProductCreatePage.form.descriptionInput.fill(VALID_FORM_VALUES.description);

    await expect(adminProductCreatePage.form.formError).toHaveCount(0);

    expect(createProductRequestCount).toBe(0);
  });

  test("maps and trims form values before creating a product", async ({ page }) => {
    await page.route(PRODUCTS_API_URL, async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();

        return;
      }

      await route.fulfill({
        status: 500,
        json: ADMIN_PRODUCT_CREATE_FAILURE_RESPONSE,
      });
    });

    await fillProductForm({
      ...VALID_FORM_VALUES,
      title: `  ${VALID_FORM_VALUES.title}  `,
      category: `  ${VALID_FORM_VALUES.category}  `,
      imageUrl: `  ${VALID_FORM_VALUES.imageUrl}  `,
      description: `  ${VALID_FORM_VALUES.description}  `,
    });

    const createProductRequestPromise = page.waitForRequest((request) => {
      return request.url() === PRODUCTS_API_URL && request.method() === "POST";
    });

    await adminProductCreatePage.form.submitButton.click();

    const createProductRequest = await createProductRequestPromise;

    expect(createProductRequest.postDataJSON()).toEqual({
      title: VALID_FORM_VALUES.title,
      price: ADMIN_PRODUCT_VALID_INPUT.price,
      category: VALID_FORM_VALUES.category,
      stock: ADMIN_PRODUCT_VALID_INPUT.stock,
      imageUrl: VALID_FORM_VALUES.imageUrl,
      description: VALID_FORM_VALUES.description,
    });
  });

  test.describe("product title validation", () => {
    test.describe("negative cases", () => {
      for (const invalidTitleCase of invalidTitleCases) {
        test(`rejects a product title ${invalidTitleCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            title: invalidTitleCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          await expect(adminProductCreatePage.form.titleInput).toHaveAccessibleDescription(
            invalidTitleCase.error,
          );
          await expect(adminProductCreatePage.form.titleInput).toHaveAttribute(
            "aria-invalid",
            "true",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validTitleCase of validTitleCases) {
        test(`accepts a product title ${validTitleCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            title: validTitleCase.value,
            price: "",
          });

          await adminProductCreatePage.form.submitButton.click();

          // The required price error proves that validation ran while preventing product creation.
          await expect(adminProductCreatePage.form.priceInput).toHaveAccessibleDescription(
            `${PRICE_HINT} Price is required.`,
          );
          await expect(adminProductCreatePage.form.titleInput).toHaveAccessibleDescription("");
          await expect(adminProductCreatePage.form.titleInput).toHaveAttribute(
            "aria-invalid",
            "false",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });
  });

  test.describe("price validation", () => {
    test.describe("negative cases", () => {
      for (const invalidPriceCase of invalidPriceCases) {
        test(`rejects a price ${invalidPriceCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            price: invalidPriceCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          await expect(adminProductCreatePage.form.priceInput).toHaveAccessibleDescription(
            `${PRICE_HINT} ${invalidPriceCase.error}`,
          );
          await expect(adminProductCreatePage.form.priceInput).toHaveAttribute(
            "aria-invalid",
            "true",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validPriceCase of validPriceCases) {
        test(`accepts a price ${validPriceCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            price: validPriceCase.value,
            stock: "",
          });

          await adminProductCreatePage.form.submitButton.click();

          // The required stock error proves that validation ran while preventing product creation.
          await expect(adminProductCreatePage.form.stockInput).toHaveAccessibleDescription(
            `${STOCK_HINT} Stock quantity is required.`,
          );
          await expect(adminProductCreatePage.form.priceInput).toHaveAccessibleDescription(
            PRICE_HINT,
          );
          await expect(adminProductCreatePage.form.priceInput).toHaveAttribute(
            "aria-invalid",
            "false",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });
  });

  test.describe("stock validation", () => {
    test.describe("negative cases", () => {
      for (const invalidStockCase of invalidStockCases) {
        test(`rejects stock ${invalidStockCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            stock: invalidStockCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          await expect(adminProductCreatePage.form.stockInput).toHaveAccessibleDescription(
            `${STOCK_HINT} ${invalidStockCase.error}`,
          );
          await expect(adminProductCreatePage.form.stockInput).toHaveAttribute(
            "aria-invalid",
            "true",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validStockCase of validStockCases) {
        test(`accepts stock ${validStockCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            stock: validStockCase.value,
            category: "",
          });

          await adminProductCreatePage.form.submitButton.click();

          // The required category error proves that validation ran while preventing product creation.
          await expect(adminProductCreatePage.form.categoryInput).toHaveAccessibleDescription(
            "Category is required.",
          );
          await expect(adminProductCreatePage.form.stockInput).toHaveAccessibleDescription(
            STOCK_HINT,
          );
          await expect(adminProductCreatePage.form.stockInput).toHaveAttribute(
            "aria-invalid",
            "false",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });
  });

  test.describe("category validation", () => {
    test.describe("negative cases", () => {
      for (const invalidCategoryCase of invalidCategoryCases) {
        test(`rejects a category ${invalidCategoryCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            category: invalidCategoryCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          await expect(adminProductCreatePage.form.categoryInput).toHaveAccessibleDescription(
            invalidCategoryCase.error,
          );
          await expect(adminProductCreatePage.form.categoryInput).toHaveAttribute(
            "aria-invalid",
            "true",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validCategoryCase of validCategoryCases) {
        test(`accepts a category ${validCategoryCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            category: validCategoryCase.value,
            imageUrl: "",
          });

          await adminProductCreatePage.form.submitButton.click();

          // The required image URL error proves that validation ran while preventing product creation.
          await expect(adminProductCreatePage.form.imageUrlInput).toHaveAccessibleDescription(
            `${IMAGE_URL_HINT} Image URL is required.`,
          );
          await expect(adminProductCreatePage.form.categoryInput).toHaveAccessibleDescription("");
          await expect(adminProductCreatePage.form.categoryInput).toHaveAttribute(
            "aria-invalid",
            "false",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });
  });

  test.describe("image URL validation", () => {
    test.describe("negative cases", () => {
      for (const invalidImageUrlCase of invalidImageUrlCases) {
        test(`rejects an image URL ${invalidImageUrlCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            imageUrl: invalidImageUrlCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          await expect(adminProductCreatePage.form.imageUrlInput).toHaveAccessibleDescription(
            `${IMAGE_URL_HINT} ${invalidImageUrlCase.error}`,
          );
          await expect(adminProductCreatePage.form.imageUrlInput).toHaveAttribute(
            "aria-invalid",
            "true",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validImageUrlCase of validImageUrlCases) {
        test(`accepts a valid image URL ${validImageUrlCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            imageUrl: validImageUrlCase.value,
            description: "",
          });

          await adminProductCreatePage.form.submitButton.click();

          // The required description error proves that validation ran while preventing product creation.
          await expect(adminProductCreatePage.form.descriptionInput).toHaveAccessibleDescription(
            "Description is required.",
          );
          await expect(adminProductCreatePage.form.imageUrlInput).toHaveAccessibleDescription(
            IMAGE_URL_HINT,
          );
          await expect(adminProductCreatePage.form.imageUrlInput).toHaveAttribute(
            "aria-invalid",
            "false",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });
  });

  test.describe("description validation", () => {
    test.describe("negative cases", () => {
      for (const invalidDescriptionCase of invalidDescriptionCases) {
        test(`rejects a description ${invalidDescriptionCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            description: invalidDescriptionCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          await expect(adminProductCreatePage.form.descriptionInput).toHaveAccessibleDescription(
            invalidDescriptionCase.error,
          );
          await expect(adminProductCreatePage.form.descriptionInput).toHaveAttribute(
            "aria-invalid",
            "true",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validDescriptionCase of validDescriptionCases) {
        test(`accepts a description ${validDescriptionCase.name}`, async () => {
          await fillProductForm({
            ...VALID_FORM_VALUES,
            title: "",
            description: validDescriptionCase.value,
          });

          await adminProductCreatePage.form.submitButton.click();

          // The required title error proves that validation ran while preventing product creation.
          await expect(adminProductCreatePage.form.titleInput).toHaveAccessibleDescription(
            "Product title is required.",
          );
          await expect(adminProductCreatePage.form.descriptionInput).toHaveAccessibleDescription(
            "",
          );
          await expect(adminProductCreatePage.form.descriptionInput).toHaveAttribute(
            "aria-invalid",
            "false",
          );

          expect(createProductRequestCount).toBe(0);
        });
      }
    });
  });
});
