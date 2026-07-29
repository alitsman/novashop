import type { Locator } from "@playwright/test";

/**
 * Pastes text into the target through the browser clipboard.
 *
 * Chromium-only: this helper requires clipboard permissions
 * to be configured for the test context.
 */
export async function pasteText(target: Locator, text: string): Promise<void> {
  await target.evaluate(async (element, clipboardText) => {
    element.focus();
    await navigator.clipboard.writeText(clipboardText);
  }, text);

  await target.press("ControlOrMeta+A");
  await target.press("ControlOrMeta+V");
}
