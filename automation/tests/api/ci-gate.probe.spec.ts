import { expect, test } from "../../src/fixtures";

test("CI gate probe intentionally fails", () => {
  expect(true).toBe(false);
});
