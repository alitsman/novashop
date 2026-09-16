import { apiUrl } from "../../src/config/playwright.shared";
import { expect, test } from "../../src/fixtures";
import { loginViaApi, seedAuthTokenForEachPageLoad } from "../../src/helpers";
import { ProductCatalogPage, ProductDetailsPage } from "../../src/pages";
import { REGULAR_USER, SEEDED_REFERENCE_PRODUCT } from "../../src/test-data";
import { formatUsd } from "../../src/utils";

test.describe("product read", () => {
  test("renders a seeded product through the real catalog and details APIs", async ({
    page,
    backendRequest,
  }) => {
    const token = await loginViaApi(backendRequest, REGULAR_USER);
    await seedAuthTokenForEachPageLoad(page, token);

    const catalogPage = new ProductCatalogPage(page);
    const productDetailsPage = new ProductDetailsPage(page);
    const productCard = catalogPage.getProductCard(SEEDED_REFERENCE_PRODUCT.title);
    const productDetailsApiUrl = new URL(
      `/products/${SEEDED_REFERENCE_PRODUCT.id}`,
      apiUrl,
    ).toString();

    await test.step("load the seeded product from the real catalog API", async () => {
      await catalogPage.open();

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
      await expect(catalogPage.heading).toBeVisible();
      await expect(catalogPage.searchInput).toBeVisible();
      await expect(catalogPage.categorySelect).toBeVisible();
      await expect(catalogPage.sortSelect).toBeVisible();
      await expect(catalogPage.loadingStatus).toBeHidden();

      await expect(productCard.title).toHaveText(SEEDED_REFERENCE_PRODUCT.title);
      await expect(productCard.category).toHaveText(SEEDED_REFERENCE_PRODUCT.category);
      await expect(productCard.description).toHaveText(SEEDED_REFERENCE_PRODUCT.description);
      await expect(productCard.price).toHaveText(formatUsd(SEEDED_REFERENCE_PRODUCT.price));

      await expect(catalogPage.errorAlert).toHaveCount(0);
      await expect(catalogPage.emptyCatalogTitle).toHaveCount(0);
      await expect(catalogPage.noResultsTitle).toHaveCount(0);
    });

    await test.step("open the seeded product through the real details API", async () => {
      const productDetailsResponsePromise = page.waitForResponse(
        (response) =>
          response.url() === productDetailsApiUrl && response.request().method() === "GET",
      );

      await productCard.openDetails();

      const productDetailsResponse = await productDetailsResponsePromise;

      expect(productDetailsResponse.status()).toBe(200);
      await expect(page).toHaveURL(`/products/${SEEDED_REFERENCE_PRODUCT.id}`);

      await expect(productDetailsPage.root).toHaveAccessibleName(SEEDED_REFERENCE_PRODUCT.title);
      await expect(productDetailsPage.heading).toHaveText(SEEDED_REFERENCE_PRODUCT.title);
      await expect(productDetailsPage.category).toHaveText(SEEDED_REFERENCE_PRODUCT.category);
      await expect(productDetailsPage.description).toHaveText(SEEDED_REFERENCE_PRODUCT.description);
      await expect(productDetailsPage.price).toHaveText(formatUsd(SEEDED_REFERENCE_PRODUCT.price));
      await expect(productDetailsPage.image).toHaveAttribute(
        "src",
        SEEDED_REFERENCE_PRODUCT.imageUrl,
      );

      await expect(productDetailsPage.purchaseOptionsHeading).toBeVisible();
      await expect(productDetailsPage.addToCart.quantityInput).toHaveValue("1");
      await expect(productDetailsPage.addToCart.available).toHaveText(
        `Available: ${SEEDED_REFERENCE_PRODUCT.stock}`,
      );
      await expect(productDetailsPage.addToCart.inCart).toHaveCount(0);

      await expect(productDetailsPage.notFoundTitle).toHaveCount(0);
      await expect(productDetailsPage.errorAlert).toHaveCount(0);
      await expect(page).toHaveTitle(`${SEEDED_REFERENCE_PRODUCT.title} | NovaShop`);
    });
  });
});
