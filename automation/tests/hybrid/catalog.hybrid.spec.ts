import { expect, test } from "../../src/fixtures";
import { loginViaApi, seedAuthTokenForEachPageLoad } from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import { REGULAR_USER, SEEDED_REFERENCE_PRODUCT } from "../../src/test-data";
import { formatUsd } from "../../src/utils";

test.describe("product catalog", () => {
  test("renders a seeded product from the real catalog API", async ({ page, backendRequest }) => {
    const token = await loginViaApi(backendRequest, REGULAR_USER);
    await seedAuthTokenForEachPageLoad(page, token);

    const catalogPage = new ProductCatalogPage(page);

    await catalogPage.open();

    await expect(page).toHaveURL("/products");
    await expect(catalogPage.header.currentUserName).toHaveText(REGULAR_USER.user.name);
    await expect(catalogPage.heading).toBeVisible();
    await expect(catalogPage.searchInput).toBeVisible();
    await expect(catalogPage.categorySelect).toBeVisible();
    await expect(catalogPage.sortSelect).toBeVisible();
    await expect(catalogPage.loadingStatus).toBeHidden();

    const productCard = catalogPage.getProductCard(SEEDED_REFERENCE_PRODUCT.title);

    await expect(productCard.title).toHaveText(SEEDED_REFERENCE_PRODUCT.title);
    await expect(productCard.category).toHaveText(SEEDED_REFERENCE_PRODUCT.category);
    await expect(productCard.description).toHaveText(SEEDED_REFERENCE_PRODUCT.description);
    await expect(productCard.price).toHaveText(formatUsd(SEEDED_REFERENCE_PRODUCT.price));

    await expect(catalogPage.errorAlert).toHaveCount(0);
    await expect(catalogPage.emptyCatalogTitle).toHaveCount(0);
    await expect(catalogPage.noResultsTitle).toHaveCount(0);
  });
});
