import type { Page } from "@playwright/test";

export async function trackAndAbortRequest(page: Page, url: string): Promise<() => boolean> {
  let wasCalled = false;

  await page.route(url, async (route) => {
    wasCalled = true;
    await route.abort();
  });

  return () => wasCalled;
}
