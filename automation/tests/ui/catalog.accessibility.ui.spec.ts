import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  holdProductCatalogUntilReleased,
  prepareMockedAuthenticatedSession,
  prepareProductCatalog,
  prepareProductCatalogNetworkFailure,
} from "../../src/helpers";
import { ProductCatalogPage } from "../../src/pages";
import { CATALOG_PRODUCTS, REGULAR_USER, createProduct } from "../../src/test-data";

test.describe(
  "catalog accessibility",
  {
    tag: [FeatureTag.Catalog, SuiteTag.A11y],
  },
  () => {
    test("populated catalog has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

      const products = CATALOG_PRODUCTS.map((product) => createProduct(product));
      await prepareProductCatalog(page, products);

      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.open();

      await expect(catalogPage.productList).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("loading state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

      const products = CATALOG_PRODUCTS.map((product) => createProduct(product));
      const heldCatalogRequest = await holdProductCatalogUntilReleased(page, products);

      const catalogPage = new ProductCatalogPage(page);

      try {
        await Promise.all([catalogPage.open(), heldCatalogRequest.requestObserved]);

        await expect(catalogPage.loadingStatus).toBeVisible();

        await expectNoAccessibilityViolations(page, testInfo);
      } finally {
        heldCatalogRequest.release();
        await heldCatalogRequest.dispose();
      }
    });

    test("error state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalogNetworkFailure(page);

      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.open();

      await expect(catalogPage.errorAlert).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("empty state has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareProductCatalog(page, []);

      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.open();

      await expect(catalogPage.emptyCatalogTitle).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });

    test("filtered no-results state has no WCAG 2.1 A/AA violations", async ({
      page,
    }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);

      const products = CATALOG_PRODUCTS.map((product) => createProduct(product));
      await prepareProductCatalog(page, products);

      const catalogPage = new ProductCatalogPage(page);
      await catalogPage.open();

      await catalogPage.searchFor("definitely-not-a-product");
      await expect(catalogPage.noResultsTitle).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
