import { test as base } from "@playwright/test";

export const test = base.extend({
  context: async ({ context }, use) => {
    // Image content is outside UI test scope, so block every image request.
    await context.route("**/*", async (route) => {
      if (route.request().resourceType() === "image") {
        await route.abort();

        return;
      }

      await route.fallback();
    });

    await use(context);
  },
});
