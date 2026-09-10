import { test as base, type APIRequestContext } from "@playwright/test";

import { apiUrl } from "../config/playwright.shared";

type BackendRequestFixtures = {
  backendRequest: APIRequestContext;
};

export const test = base.extend<BackendRequestFixtures>({
  backendRequest: async ({ playwright }, use) => {
    const backendRequestContext = await playwright.request.newContext({
      baseURL: apiUrl,
    });

    await use(backendRequestContext);

    await backendRequestContext.dispose();
  },
});
