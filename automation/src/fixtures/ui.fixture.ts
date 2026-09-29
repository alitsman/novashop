import { expect, test as base } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";

export type IsolatedApiGuardOptions = {
  isolatedApiGuard: boolean;
};

const API_ORIGIN = new URL(apiUrl).origin;

export const test = base.extend<IsolatedApiGuardOptions>({
  isolatedApiGuard: [false, { option: true }],

  context: async ({ context, isolatedApiGuard }, use) => {
    // Image content is outside UI test scope, so block every image request.
    await context.route("**/*", async (route) => {
      if (route.request().resourceType() === "image") {
        await route.abort();

        return;
      }

      await route.fallback();
    });

    if (!isolatedApiGuard) {
      await use(context);

      return;
    }

    // Let expected API mocks handle their requests.
    // Any other API request is blocked and fails the test.
    const unexpectedApiRequests: string[] = [];

    await context.route(
      (url) => url.origin === API_ORIGIN,
      async (route) => {
        const request = route.request();

        unexpectedApiRequests.push(`${request.method()} ${request.url()}`);

        await route.abort();
      },
    );

    await use(context);

    expect(unexpectedApiRequests, "Isolated UI made unmocked API requests").toEqual([]);
  },
});
