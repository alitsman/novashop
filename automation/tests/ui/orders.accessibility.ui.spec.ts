import { FeatureTag, SuiteTag } from "../../src/config/test-tags";
import { expect, test } from "../../src/fixtures";
import {
  expectNoAccessibilityViolations,
  prepareMockedAuthenticatedSession,
  prepareOrders,
} from "../../src/helpers";
import { OrdersPage } from "../../src/pages";
import { ORDERS_REFERENCE_ORDER, REGULAR_USER } from "../../src/test-data";

test.describe(
  "orders accessibility",
  {
    tag: [FeatureTag.Orders, SuiteTag.A11y],
  },
  () => {
    test("populated orders page has no WCAG 2.1 A/AA violations", async ({ page }, testInfo) => {
      await prepareMockedAuthenticatedSession(page, REGULAR_USER.user);
      await prepareOrders(page, [ORDERS_REFERENCE_ORDER]);

      const ordersPage = new OrdersPage(page);
      await ordersPage.open();

      await expect(ordersPage.ordersList).toBeVisible();

      await expectNoAccessibilityViolations(page, testInfo);
    });
  },
);
