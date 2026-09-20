import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import {
  prepareCart,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
} from "../../src/helpers";
import { CheckoutPage } from "../../src/pages";
import { CART_PRODUCT_A, REGULAR_USER, createCartItem } from "../../src/test-data";

const ORDERS_API_URL = new URL("/orders", apiUrl).toString();

const VALID_FULL_NAME = "Test Customer";
const VALID_PHONE = "1234567";
const VALID_ADDRESS = "12 Test Street";

const invalidFullNameCases = [
  {
    name: "with hidden control characters",
    // U+0001 is a disallowed control character.
    value: "Test\u0001Customer",
    error: "Remove hidden control characters from full name.",
  },
  {
    name: "with angle brackets",
    value: "Test <Customer>",
    error: "Remove angle brackets (< >) from full name.",
  },
  {
    name: "shorter than 2 characters",
    value: "A",
    error: "Full name must be at least 2 characters.",
  },
  {
    name: "longer than 80 characters",
    value: "A".repeat(81),
    error: "Full name must be 80 characters or less.",
  },
  {
    name: "without a letter",
    value: "123",
    error: "Full name must contain at least one letter.",
  },
  {
    name: "with unsupported characters",
    value: "Test_Customer",
    error: "Use only letters, spaces, apostrophes, periods, or hyphens in full name.",
  },
];

const validFullNameCases = [
  {
    name: "with Unicode Cyrillic letters",
    // Cyrillic script: "Test Name".
    value: "Тестовое Имя",
  },
  {
    name: "with spaces, apostrophes, periods, and hyphens",
    value: "Test-Customer O'Example.",
  },
];

const invalidPhoneCases = [
  {
    name: "with hidden control characters",
    // U+0001 is a disallowed control character.
    value: "123\u00014567",
    error: "Remove hidden control characters from phone number.",
  },
  {
    name: "with unsupported characters",
    value: "123.4567",
    error: "Use only digits, spaces, +, hyphens, or parentheses in phone number.",
  },
  {
    name: "with more than one plus sign",
    value: "++1234567",
    error: "Use only one plus sign in phone number.",
  },
  {
    name: "with a plus sign outside the beginning",
    value: "123+4567",
    error: "Move the plus sign to the beginning of phone number.",
  },
  {
    name: "with fewer than 7 digits",
    value: "123456",
    error: "Phone number looks too short.",
  },
  {
    name: "with more than 15 digits",
    value: "1234567890123456",
    error: "Phone number looks too long.",
  },
];

const validPhoneCases = [
  {
    name: "with digits only",
    value: "1234567",
  },
  {
    name: "with international formatting",
    value: "+1 (202) 555-0147",
  },
];

const invalidAddressCases = [
  {
    name: "with hidden control characters",
    // U+0001 is a disallowed control character.
    value: "12 Test\u0001 Street",
    error: "Remove hidden control characters from delivery address.",
  },
  {
    name: "with angle brackets",
    value: "12 <Test> Street",
    error: "Remove angle brackets (< >) from delivery address.",
  },
  {
    name: "shorter than 5 characters",
    value: "A 1",
    error: "Delivery address must be at least 5 characters.",
  },
  {
    name: "longer than 200 characters",
    value: `${"A".repeat(200)}1`,
    error: "Delivery address must be 200 characters or less.",
  },
  {
    name: "without a letter or digit",
    value: "-----",
    error: "Delivery address must contain at least one letter or digit.",
  },
];

const validAddressCases = [
  {
    name: "with Unicode Georgian letters",
    // Georgian script: "Tbilisi, Test Street 12".
    value: "თბილისი, სატესტო ქუჩა 12",
  },
  {
    name: "with spaces and punctuation",
    value: "12 Test Street, Apt. #5",
  },
];

test.describe("checkout form validation", () => {
  let checkoutPage: CheckoutPage;
  let createOrderRequestCount: number;

  test.beforeEach(async ({ page }) => {
    await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
    await prepareProductCatalog(page, [CART_PRODUCT_A]);
    await prepareCart(page, REGULAR_USER.user.id, [createCartItem(CART_PRODUCT_A)]);

    checkoutPage = new CheckoutPage(page);
    createOrderRequestCount = 0;

    page.on("request", (request) => {
      if (request.url() === ORDERS_API_URL && request.method() === "POST") {
        createOrderRequestCount += 1;
      }
    });

    await checkoutPage.open();
    await expect(checkoutPage.submitButton).toBeEnabled();
  });

  test.describe("full name validation", () => {
    test.describe("negative cases", () => {
      for (const invalidFullNameCase of invalidFullNameCases) {
        test(`rejects a full name ${invalidFullNameCase.name}`, async () => {
          await checkoutPage.fullNameInput.fill(invalidFullNameCase.value);
          await checkoutPage.phoneInput.fill(VALID_PHONE);
          await checkoutPage.addressInput.fill(VALID_ADDRESS);

          await checkoutPage.submitButton.click();

          await expect(checkoutPage.fullNameInput).toHaveAccessibleDescription(
            invalidFullNameCase.error,
          );
          await expect(checkoutPage.fullNameInput).toHaveAttribute("aria-invalid", "true");

          expect(createOrderRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validFullNameCase of validFullNameCases) {
        test(`accepts a valid full name ${validFullNameCase.name}`, async () => {
          await checkoutPage.fullNameInput.fill(validFullNameCase.value);
          await checkoutPage.addressInput.fill(VALID_ADDRESS);

          await checkoutPage.submitButton.click();

          // The required phone error proves that validation ran while preventing order creation.
          await expect(checkoutPage.phoneInput).toHaveAccessibleDescription(
            "Phone number is required.",
          );
          await expect(checkoutPage.fullNameInput).toHaveAccessibleDescription("");
          await expect(checkoutPage.fullNameInput).toHaveAttribute("aria-invalid", "false");
        });
      }
    });
  });

  test.describe("phone validation", () => {
    test.describe("negative cases", () => {
      for (const invalidPhoneCase of invalidPhoneCases) {
        test(`rejects a phone number ${invalidPhoneCase.name}`, async () => {
          await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
          await checkoutPage.phoneInput.fill(invalidPhoneCase.value);
          await checkoutPage.addressInput.fill(VALID_ADDRESS);

          await checkoutPage.submitButton.click();

          await expect(checkoutPage.phoneInput).toHaveAccessibleDescription(invalidPhoneCase.error);
          await expect(checkoutPage.phoneInput).toHaveAttribute("aria-invalid", "true");

          expect(createOrderRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validPhoneCase of validPhoneCases) {
        test(`accepts a valid phone number ${validPhoneCase.name}`, async () => {
          await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
          await checkoutPage.phoneInput.fill(validPhoneCase.value);

          await checkoutPage.submitButton.click();

          // The required address error proves that validation ran while preventing order creation.
          await expect(checkoutPage.addressInput).toHaveAccessibleDescription(
            "Delivery address is required.",
          );
          await expect(checkoutPage.phoneInput).toHaveAccessibleDescription("");
          await expect(checkoutPage.phoneInput).toHaveAttribute("aria-invalid", "false");
        });
      }
    });
  });

  test.describe("delivery address validation", () => {
    test.describe("negative cases", () => {
      for (const invalidAddressCase of invalidAddressCases) {
        test(`rejects a delivery address ${invalidAddressCase.name}`, async () => {
          await checkoutPage.fullNameInput.fill(VALID_FULL_NAME);
          await checkoutPage.phoneInput.fill(VALID_PHONE);
          await checkoutPage.addressInput.fill(invalidAddressCase.value);

          await checkoutPage.submitButton.click();

          await expect(checkoutPage.addressInput).toHaveAccessibleDescription(
            invalidAddressCase.error,
          );
          await expect(checkoutPage.addressInput).toHaveAttribute("aria-invalid", "true");

          expect(createOrderRequestCount).toBe(0);
        });
      }
    });

    test.describe("positive cases", () => {
      for (const validAddressCase of validAddressCases) {
        test(`accepts a valid delivery address ${validAddressCase.name}`, async () => {
          await checkoutPage.phoneInput.fill(VALID_PHONE);
          await checkoutPage.addressInput.fill(validAddressCase.value);

          await checkoutPage.submitButton.click();

          // The required full-name error proves that validation ran while preventing order creation.
          await expect(checkoutPage.fullNameInput).toHaveAccessibleDescription(
            "Full name is required.",
          );
          await expect(checkoutPage.addressInput).toHaveAccessibleDescription("");
          await expect(checkoutPage.addressInput).toHaveAttribute("aria-invalid", "false");
        });
      }
    });
  });
});
