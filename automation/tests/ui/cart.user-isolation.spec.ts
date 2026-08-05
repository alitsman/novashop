import { test, expect } from "@playwright/test";
import { CartPage, LoginPage, ProductCatalogPage } from "../../src/pages";
import { prepareProductCatalog } from "../../src/helpers";
import { formatUsd } from "../../src/utils";
import {
  ADD_TO_CART_PRODUCT_A,
  ADD_TO_CART_PRODUCT_B,
  ADD_TO_CART_PRODUCTS,
  ADMIN_USER,
  REGULAR_USER,
  createProduct,
} from "../../src/test-data";

test.describe("cart isolation between users", () => {
  const seedProducts = ADD_TO_CART_PRODUCTS.map((product) =>
    createProduct(product),
  );

  const regularUserProduct = ADD_TO_CART_PRODUCT_A;
  const adminUserProduct = ADD_TO_CART_PRODUCT_B;

  const regularUserQuantity = 2;
  const adminUserQuantity = 1;

  let loginPage: LoginPage;
  let catalogPage: ProductCatalogPage;
  let cartPage: CartPage;

  // Deliberately no authenticateUser here: it seeds auth through
  // addInitScript, which re-runs on every navigation and would silently
  // sign the user back in after logout. This spec must log in through the UI.
  test.beforeEach(async ({ page }) => {
    await prepareProductCatalog(page, seedProducts);

    loginPage = new LoginPage(page);
    catalogPage = new ProductCatalogPage(page);
    cartPage = new CartPage(page);

    await loginPage.open();
  });

  // Single BrowserContext on purpose: separate contexts have separate
  // localStorage, so Playwright would provide the isolation instead of the app.
  test("keeps carts isolated when users switch in the same browser context", async ({
    page,
  }) => {
    await test.step("signs in as the regular user and adds a product", async () => {
      await loginPage.signIn(REGULAR_USER.user.email, REGULAR_USER.password);

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.header.currentUserName).toHaveText(
        REGULAR_USER.user.name,
      );
      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        "Cart, 0 items",
      );

      const productCard = catalogPage.getProductCard(regularUserProduct.title);

      await productCard.addToCart.fillQuantity(String(regularUserQuantity));
      await productCard.addToCart.submit();

      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${regularUserQuantity} items`,
      );
    });

    await test.step("signs in as the admin and sees an empty cart", async () => {
      await catalogPage.header.logout();

      await expect(page).toHaveURL("/login");

      await loginPage.signIn(ADMIN_USER.user.email, ADMIN_USER.password);

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.header.currentUserName).toHaveText(
        ADMIN_USER.user.name,
      );
      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        "Cart, 0 items",
      );

      await catalogPage.header.openCart();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.emptyCartTitle).toBeVisible();
      await expect(cartPage.cartItemsList).toHaveCount(0);
      await expect(cartPage.orderSummaryBlock).toHaveCount(0);
    });

    await test.step("adds a different product as the admin", async () => {
      await catalogPage.open();

      const productCard = catalogPage.getProductCard(adminUserProduct.title);

      await productCard.addToCart.fillQuantity(String(adminUserQuantity));
      await productCard.addToCart.submit();

      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${adminUserQuantity} item`,
      );

      await catalogPage.header.openCart();

      await expect(cartPage.cartItems).toHaveCount(1);
      await expect(cartPage.cartItemTitles).toHaveText([
        adminUserProduct.title,
      ]);
    });

    await test.step("signs back in as the regular user and restores the original cart", async () => {
      await cartPage.header.logout();

      await expect(page).toHaveURL("/login");

      await loginPage.signIn(REGULAR_USER.user.email, REGULAR_USER.password);

      await expect(page).toHaveURL("/products");
      await expect(catalogPage.header.currentUserName).toHaveText(
        REGULAR_USER.user.name,
      );
      await expect(catalogPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${regularUserQuantity} items`,
      );

      await catalogPage.header.openCart();

      await expect(cartPage.cartItems).toHaveCount(1);
      await expect(cartPage.cartItemTitles).toHaveText([
        regularUserProduct.title,
      ]);

      const cartItem = cartPage.getCartItem(regularUserProduct.title);

      await expect(cartItem.quantityInput).toHaveValue(
        String(regularUserQuantity),
      );
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(regularUserProduct.price * regularUserQuantity)}`,
      );
    });
  });
});
