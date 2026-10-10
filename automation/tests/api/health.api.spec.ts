import { expect, test } from "@playwright/test";

import { FeatureTag } from "../../src/config/test-tags";

test.describe("GET /health", { tag: FeatureTag.Platform }, () => {
  test("returns service health and the local commit identifier", async ({ request }) => {
    const response = await request.get("/health");

    expect(response.status()).toBe(200);

    expect(await response.json()).toEqual({
      status: "ok",
      service: "novashop-backend",
      commit: "local",
    });
  });
});
