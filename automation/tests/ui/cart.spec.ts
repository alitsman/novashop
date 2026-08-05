import { test, expect } from "@playwright/test";
import { CartPage } from "../../src/pages";
import { authenticateUser, prepareCart } from "../../src/helpers";
import { formatUsd } from "../../src/utils";
import {
  CART_ITEM_A,
  CART_ITEMS,
  REGULAR_USER,
  createCartItem,
} from "../../src/test-data";

const MIN_CART_QUANTITY = 1;

test.describe("cart", () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    await authenticateUser(page, REGULAR_USER);

    cartPage = new CartPage(page);
  });

  test("shows the empty-cart state and lets the user return to products", async ({
    page,
  }) => {
    await cartPage.open();

    await expect(page).toHaveURL("/cart");
    await expect(cartPage.heading).toBeVisible();
    await expect(cartPage.header.cartLink).toHaveAccessibleName(
      "Cart, 0 items",
    );
    await expect(cartPage.emptyCartTitle).toBeVisible();
    await expect(cartPage.cartItemsList).toHaveCount(0);
    await expect(cartPage.orderSummaryBlock).toHaveCount(0);

    await cartPage.goToProductsLink.click();

    await expect(page).toHaveURL("/products");
  });

  test.describe("with a single item", () => {
    const seedCartItem = createCartItem(CART_ITEM_A);

    const initialQuantity = seedCartItem.quantity;
    const maximumQuantity = seedCartItem.stock;

    test.beforeEach(async ({ page }) => {
      await prepareCart(page, REGULAR_USER.user.id, [seedCartItem]);

      await cartPage.open();
    });

    test("changes item quantity with buttons and enforces min and max boundaries", async () => {
      const cartItem = cartPage.getCartItem(seedCartItem.title);

      await expect(cartItem.quantityInput).toHaveValue(String(initialQuantity));
      await expect(cartItem.decreaseButton).toBeEnabled();

      await cartItem.decreaseQuantity(initialQuantity - MIN_CART_QUANTITY);

      await expect(cartItem.quantityInput).toHaveValue(
        String(MIN_CART_QUANTITY),
      );
      await expect(cartItem.decreaseButton).toBeDisabled();
      await expect(cartItem.increaseButton).toBeEnabled();
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * MIN_CART_QUANTITY)}`,
      );
      await expect(cartPage.summaryQuantity).toHaveText("1 item in cart");
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(seedCartItem.price * MIN_CART_QUANTITY)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        "Cart, 1 item",
      );

      await cartItem.increaseQuantity(initialQuantity - MIN_CART_QUANTITY);

      await expect(cartItem.quantityInput).toHaveValue(String(initialQuantity));
      await expect(cartItem.decreaseButton).toBeEnabled();

      await cartItem.increaseQuantity(maximumQuantity - initialQuantity);

      await expect(cartItem.quantityInput).toHaveValue(String(maximumQuantity));
      await expect(cartItem.increaseButton).toBeDisabled();
      await expect(cartItem.decreaseButton).toBeEnabled();
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * maximumQuantity)}`,
      );
      await expect(cartPage.summaryQuantity).toHaveText(
        `${maximumQuantity} items in cart`,
      );
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(seedCartItem.price * maximumQuantity)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${maximumQuantity} items`,
      );
    });

    test("changes item quantity with ArrowUp and ArrowDown and enforces boundaries", async () => {
      const cartItem = cartPage.getCartItem(seedCartItem.title);

      await expect(cartItem.quantityInput).toHaveValue(String(initialQuantity));

      await cartItem.pressQuantityKey(
        "ArrowDown",
        initialQuantity - MIN_CART_QUANTITY,
      );

      await expect(cartItem.quantityInput).toHaveValue(
        String(MIN_CART_QUANTITY),
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        "Cart, 1 item",
      );

      await cartItem.pressQuantityKey("ArrowDown");

      await expect(cartItem.quantityInput).toHaveValue(
        String(MIN_CART_QUANTITY),
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        "Cart, 1 item",
      );

      await cartItem.pressQuantityKey(
        "ArrowUp",
        maximumQuantity - MIN_CART_QUANTITY,
      );

      await expect(cartItem.quantityInput).toHaveValue(String(maximumQuantity));
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * maximumQuantity)}`,
      );
      await expect(cartPage.summaryQuantity).toHaveText(
        `${maximumQuantity} items in cart`,
      );
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(seedCartItem.price * maximumQuantity)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${maximumQuantity} items`,
      );

      await cartItem.pressQuantityKey("ArrowUp");

      await expect(cartItem.quantityInput).toHaveValue(String(maximumQuantity));
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${maximumQuantity} items`,
      );
    });

    test("validates invalid quantity drafts and restores a valid committed quantity", async () => {
      const cartItem = cartPage.getCartItem(seedCartItem.title);

      await expect(cartItem.quantityInput).toHaveValue(String(initialQuantity));

      await test.step("rejects a quantity below the minimum and recovers", async () => {
        await cartItem.fillQuantity("0");

        await expect(cartItem.quantityInput).toHaveValue("0");
        await expect(cartItem.quantityError).toHaveText(
          "Quantity must be at least 1.",
        );
        await expect(cartItem.quantityInput).toHaveAttribute(
          "aria-invalid",
          "true",
        );
        await expect(cartItem.quantityInput).toHaveAccessibleDescription(
          `Choose a quantity from 1 to ${maximumQuantity}. Quantity must be at least 1.`,
        );
        await expect(cartItem.decreaseButton).toBeDisabled();
        await expect(cartItem.increaseButton).toBeEnabled();
        await expect(cartItem.itemTotal).toHaveText(
          `Item total: ${formatUsd(seedCartItem.price * initialQuantity)}`,
        );
        await expect(cartPage.summaryQuantity).toHaveText(
          `${initialQuantity} items in cart`,
        );
        await expect(cartPage.header.cartLink).toHaveAccessibleName(
          `Cart, ${initialQuantity} items`,
        );

        await cartItem.increaseQuantity();

        await expect(cartItem.quantityInput).toHaveValue(
          String(MIN_CART_QUANTITY),
        );
        await expect(cartItem.quantityError).toHaveCount(0);
        await expect(cartItem.quantityInput).toHaveAttribute(
          "aria-invalid",
          "false",
        );
        await expect(cartItem.itemTotal).toHaveText(
          `Item total: ${formatUsd(seedCartItem.price * MIN_CART_QUANTITY)}`,
        );
        await expect(cartPage.summaryQuantity).toHaveText("1 item in cart");
        await expect(cartPage.header.cartLink).toHaveAccessibleName(
          "Cart, 1 item",
        );
      });

      await test.step("rejects a quantity above the available stock and recovers", async () => {
        await cartItem.fillQuantity(String(maximumQuantity + 10));

        await expect(cartItem.quantityInput).toHaveValue(
          String(maximumQuantity + 10),
        );
        await expect(cartItem.quantityError).toHaveText(
          `Only ${maximumQuantity} items are available in total.`,
        );
        await expect(cartItem.quantityInput).toHaveAttribute(
          "aria-invalid",
          "true",
        );
        await expect(cartItem.decreaseButton).toBeEnabled();
        await expect(cartItem.increaseButton).toBeDisabled();
        await expect(cartItem.itemTotal).toHaveText(
          `Item total: ${formatUsd(seedCartItem.price * MIN_CART_QUANTITY)}`,
        );
        await expect(cartPage.summaryQuantity).toHaveText("1 item in cart");
        await expect(cartPage.header.cartLink).toHaveAccessibleName(
          "Cart, 1 item",
        );

        await cartItem.decreaseQuantity();

        await expect(cartItem.quantityInput).toHaveValue(
          String(maximumQuantity),
        );
        await expect(cartItem.quantityError).toHaveCount(0);
        await expect(cartItem.quantityInput).toHaveAttribute(
          "aria-invalid",
          "false",
        );
        await expect(cartItem.itemTotal).toHaveText(
          `Item total: ${formatUsd(seedCartItem.price * maximumQuantity)}`,
        );
        await expect(cartPage.summaryQuantity).toHaveText(
          `${maximumQuantity} items in cart`,
        );
        await expect(cartPage.header.cartLink).toHaveAccessibleName(
          `Cart, ${maximumQuantity} items`,
        );
      });

      await test.step("rejects an empty quantity and recovers through manual input", async () => {
        await cartItem.pressQuantityKey("Backspace");

        await expect(cartItem.quantityInput).toHaveValue("");
        await expect(cartItem.quantityError).toHaveText("Enter a quantity.");
        await expect(cartItem.quantityInput).toHaveAttribute(
          "aria-invalid",
          "true",
        );
        await expect(cartItem.decreaseButton).toBeDisabled();
        await expect(cartItem.increaseButton).toBeDisabled();
        await expect(cartItem.itemTotal).toHaveText(
          `Item total: ${formatUsd(seedCartItem.price * maximumQuantity)}`,
        );
        await expect(cartPage.summaryQuantity).toHaveText(
          `${maximumQuantity} items in cart`,
        );
        await expect(cartPage.header.cartLink).toHaveAccessibleName(
          `Cart, ${maximumQuantity} items`,
        );

        await cartItem.fillQuantity(String(initialQuantity));

        await expect(cartItem.quantityInput).toHaveValue(
          String(initialQuantity),
        );
        await expect(cartItem.quantityError).toHaveCount(0);
        await expect(cartItem.quantityInput).toHaveAttribute(
          "aria-invalid",
          "false",
        );
        await expect(cartItem.itemTotal).toHaveText(
          `Item total: ${formatUsd(seedCartItem.price * initialQuantity)}`,
        );
        await expect(cartPage.summaryQuantity).toHaveText(
          `${initialQuantity} items in cart`,
        );
        await expect(cartPage.header.cartLink).toHaveAccessibleName(
          `Cart, ${initialQuantity} items`,
        );
      });
    });

    test("accepts a valid pasted quantity and rejects unsupported pasted formats", async ({
      browserName,
      context,
    }) => {
      // Chromium-only: this scenario requires browser clipboard permissions.
      test.skip(
        browserName !== "chromium",
        "Clipboard-based paste is supported only in the Chromium project.",
      );

      await context.grantPermissions(["clipboard-read", "clipboard-write"]);

      const cartItem = cartPage.getCartItem(seedCartItem.title);
      const pastedQuantity = 3;

      await cartItem.pasteQuantity(String(pastedQuantity));

      await expect(cartItem.quantityInput).toHaveValue(String(pastedQuantity));
      await expect(cartItem.quantityError).toHaveCount(0);
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * pastedQuantity)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${pastedQuantity} items`,
      );

      await cartItem.pasteQuantity("-4");

      await expect(cartItem.quantityInput).toHaveValue(String(pastedQuantity));

      await cartItem.pasteQuantity("1.5");

      await expect(cartItem.quantityInput).toHaveValue(String(pastedQuantity));
      await expect(cartItem.quantityError).toHaveCount(0);
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${pastedQuantity} items`,
      );
    });

    test("restores the committed cart state after reload", async ({ page }) => {
      const cartItem = cartPage.getCartItem(seedCartItem.title);

      await expect(cartItem.quantityInput).toHaveValue(String(initialQuantity));
      await expect(cartItem.quantityError).toHaveCount(0);
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * initialQuantity)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${initialQuantity} items`,
      );

      await cartItem.increaseQuantity();

      await expect(cartItem.quantityInput).toHaveValue(
        String(initialQuantity + 1),
      );
      await expect(cartItem.quantityError).toHaveCount(0);
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * (initialQuantity + 1))}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${initialQuantity + 1} items`,
      );

      await page.reload();

      await expect(cartItem.quantityInput).toHaveValue(
        String(initialQuantity + 1),
      );
      await expect(cartItem.quantityError).toHaveCount(0);
      await expect(cartItem.itemTotal).toHaveText(
        `Item total: ${formatUsd(seedCartItem.price * (initialQuantity + 1))}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${initialQuantity + 1} items`,
      );
    });
  });

  test.describe("with multiple items", () => {
    const seedCartItems = CART_ITEMS.map((item) => createCartItem(item));
    const [seedCartItemA, seedCartItemB] = seedCartItems;

    test.beforeEach(async ({ page }) => {
      await prepareCart(page, REGULAR_USER.user.id, seedCartItems);

      await cartPage.open();
    });

    test("commits a valid manually entered quantity and recalculates cart totals", async () => {
      const cartItemA = cartPage.getCartItem(seedCartItemA.title);
      const cartItemB = cartPage.getCartItem(seedCartItemB.title);

      const initialSummaryQuantity =
        seedCartItemA.quantity + seedCartItemB.quantity;
      const initialItemTotalA = seedCartItemA.quantity * seedCartItemA.price;
      const initialItemTotalB = seedCartItemB.quantity * seedCartItemB.price;
      const initialSummaryTotal = initialItemTotalA + initialItemTotalB;

      const updatedQuantityItemA = 4;
      const updatedSummaryQuantity =
        updatedQuantityItemA + seedCartItemB.quantity;
      const updatedItemTotalA = updatedQuantityItemA * seedCartItemA.price;
      const updatedSummaryTotal = updatedItemTotalA + initialItemTotalB;

      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length);
      await expect(cartPage.cartItemTitles).toHaveText([
        seedCartItemA.title,
        seedCartItemB.title,
      ]);

      await expect(cartItemA.quantityInput).toHaveValue(
        String(seedCartItemA.quantity),
      );
      await expect(cartItemB.quantityInput).toHaveValue(
        String(seedCartItemB.quantity),
      );

      await expect(cartItemA.itemTotal).toHaveText(
        `Item total: ${formatUsd(initialItemTotalA)}`,
      );
      await expect(cartItemB.itemTotal).toHaveText(
        `Item total: ${formatUsd(initialItemTotalB)}`,
      );

      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(initialSummaryTotal)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${initialSummaryQuantity} items`,
      );

      // No blur or Enter between the input and the assertions on purpose:
      // the control commits a valid draft immediately, and adding either
      // would silently remove that coverage.
      await cartItemA.fillQuantity(String(updatedQuantityItemA));

      await expect(cartItemA.quantityInput).toHaveValue(
        String(updatedQuantityItemA),
      );
      await expect(cartItemB.quantityInput).toHaveValue(
        String(seedCartItemB.quantity),
      );

      await expect(cartItemA.itemTotal).toHaveText(
        `Item total: ${formatUsd(updatedItemTotalA)}`,
      );
      await expect(cartItemB.itemTotal).toHaveText(
        `Item total: ${formatUsd(initialItemTotalB)}`,
      );

      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(updatedSummaryTotal)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${updatedSummaryQuantity} items`,
      );

      await expect(cartPage.cartItemTitles).toHaveText([
        seedCartItemA.title,
        seedCartItemB.title,
      ]);
    });

    test("blocks checkout while quantity drafts are invalid and focuses the first offending item", async ({
      page,
    }) => {
      const cartItemA = cartPage.getCartItem(seedCartItemA.title);
      const cartItemB = cartPage.getCartItem(seedCartItemB.title);

      await cartItemA.fillQuantity("");
      await cartItemB.fillQuantity("");

      // Wait for both rows to render their validation error: the control
      // reports validity to the page in an effect, so clicking Checkout
      // before that lands could race the block.
      await expect(cartItemA.quantityError).toHaveText("Enter a quantity.");
      await expect(cartItemB.quantityError).toHaveText("Enter a quantity.");

      await expect(cartPage.goToCheckoutButton).toBeEnabled();
      await expect(cartPage.checkoutError).toHaveCount(0);

      await cartPage.goToCheckoutButton.click();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.checkoutError).toHaveText(
        "Enter a valid quantity for each cart item before checkout.",
      );
      await expect(cartItemA.quantityInput).toBeFocused();

      await cartItemA.fillQuantity(String(seedCartItemA.quantity));

      await expect(cartItemA.quantityError).toHaveCount(0);
      await expect(cartPage.checkoutError).toHaveText(
        "Enter a valid quantity for each cart item before checkout.",
      );

      await cartPage.goToCheckoutButton.click();

      await expect(page).toHaveURL("/cart");
      await expect(cartItemB.quantityInput).toBeFocused();

      await cartItemB.fillQuantity(String(seedCartItemB.quantity));

      await expect(cartItemB.quantityError).toHaveCount(0);
      await expect(cartPage.checkoutError).toHaveCount(0);

      await cartPage.goToCheckoutButton.click();

      await expect(page).toHaveURL("/checkout");
    });

    test("cancels item removal without changing the cart", async () => {
      const cartItemA = cartPage.getCartItem(seedCartItemA.title);
      const cartItemB = cartPage.getCartItem(seedCartItemB.title);

      const initialSummaryQuantity =
        seedCartItemA.quantity + seedCartItemB.quantity;
      const initialItemTotalA = seedCartItemA.quantity * seedCartItemA.price;
      const initialItemTotalB = seedCartItemB.quantity * seedCartItemB.price;
      const initialSummaryTotal = initialItemTotalA + initialItemTotalB;

      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length);

      await cartItemA.removeButton.click();

      await expect(cartPage.removeItemDialog.root).toBeVisible();

      await cartPage.removeItemDialog.cancel();

      await expect(cartPage.removeItemDialog.root).toHaveCount(0);
      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length);
      await expect(cartPage.cartItemTitles).toHaveText([
        seedCartItemA.title,
        seedCartItemB.title,
      ]);

      await expect(cartItemA.quantityInput).toHaveValue(
        String(seedCartItemA.quantity),
      );
      await expect(cartItemB.quantityInput).toHaveValue(
        String(seedCartItemB.quantity),
      );

      await expect(cartItemA.itemTotal).toHaveText(
        `Item total: ${formatUsd(initialItemTotalA)}`,
      );
      await expect(cartItemB.itemTotal).toHaveText(
        `Item total: ${formatUsd(initialItemTotalB)}`,
      );

      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(initialSummaryTotal)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${initialSummaryQuantity} items`,
      );
    });

    test("dismisses the removal dialog with Escape, targets the right item, and restores focus", async () => {
      const cartItemB = cartPage.getCartItem(seedCartItemB.title);

      await cartItemB.removeButton.click();

      await expect(cartPage.removeItemDialog.root).toBeVisible();
      await expect(cartPage.removeItemDialog.cancelButton).toBeFocused();
      await expect(cartPage.removeItemDialog.root).toHaveAccessibleDescription(
        `Are you sure you want to remove ${seedCartItemB.title} from your cart?`,
      );

      await cartPage.removeItemDialog.root.press("Escape");

      await expect(cartPage.removeItemDialog.root).toHaveCount(0);
      await expect(cartItemB.removeButton).toBeFocused();
      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length);
      await expect(cartPage.cartItemTitles).toHaveText([
        seedCartItemA.title,
        seedCartItemB.title,
      ]);
    });

    test("removes the selected item, recalculates the cart, and reaches the empty state", async () => {
      const cartItemA = cartPage.getCartItem(seedCartItemA.title);
      const cartItemB = cartPage.getCartItem(seedCartItemB.title);

      const initialItemTotalA = seedCartItemA.quantity * seedCartItemA.price;

      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length);

      await cartItemB.removeButton.click();

      await expect(cartPage.removeItemDialog.root).toBeVisible();

      await cartPage.removeItemDialog.confirm();

      await expect(cartPage.removeItemDialog.root).toHaveCount(0);
      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length - 1);
      await expect(cartPage.cartItemTitles).toHaveText([seedCartItemA.title]);
      await expect(cartItemA.quantityInput).toHaveValue(
        String(seedCartItemA.quantity),
      );
      await expect(cartItemA.itemTotal).toHaveText(
        `Item total: ${formatUsd(initialItemTotalA)}`,
      );

      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(initialItemTotalA)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${seedCartItemA.quantity} items`,
      );

      await cartItemA.removeButton.click();

      await expect(cartPage.removeItemDialog.root).toBeVisible();

      await cartPage.removeItemDialog.confirm();

      await expect(cartPage.cartItemsList).toHaveCount(0);
      await expect(cartPage.orderSummaryBlock).toHaveCount(0);
      await expect(cartPage.emptyCartTitle).toBeVisible();
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        "Cart, 0 items",
      );
    });

    test("clears the checkout block when the invalid item is removed", async ({
      page,
    }) => {
      const cartItemB = cartPage.getCartItem(seedCartItemB.title);

      const initialItemTotalA = seedCartItemA.quantity * seedCartItemA.price;

      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length);

      await cartItemB.fillQuantity("");

      // Wait for the row to render its validation error: the control reports
      // validity to the page in an effect, so clicking Checkout before that
      // lands could race the block.
      await expect(cartItemB.quantityError).toHaveText("Enter a quantity.");

      await cartPage.goToCheckoutButton.click();

      await expect(page).toHaveURL("/cart");
      await expect(cartPage.checkoutError).toHaveText(
        "Enter a valid quantity for each cart item before checkout.",
      );

      await cartItemB.removeButton.click();

      await expect(cartPage.removeItemDialog.root).toBeVisible();

      await cartPage.removeItemDialog.confirm();

      await expect(cartPage.removeItemDialog.root).toHaveCount(0);
      await expect(cartPage.cartItems).toHaveCount(seedCartItems.length - 1);
      await expect(cartPage.cartItemTitles).toHaveText([seedCartItemA.title]);
      await expect(cartPage.checkoutError).toHaveCount(0);
      await expect(cartPage.summaryTotal).toHaveText(
        `Total: ${formatUsd(initialItemTotalA)}`,
      );
      await expect(cartPage.header.cartLink).toHaveAccessibleName(
        `Cart, ${seedCartItemA.quantity} items`,
      );

      await cartPage.goToCheckoutButton.click();

      await expect(page).toHaveURL("/checkout");
    });
  });
});
