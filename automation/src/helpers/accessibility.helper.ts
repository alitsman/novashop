import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";

/**
 * Runs WCAG 2.1 Level A and AA automated accessibility checks.
 *
 * Every reported violation fails the test regardless of impact severity.
 * The complete axe results are attached to the Playwright report on failure.
 *
 * Incomplete results are attached separately for manual investigation,
 * but do not fail the test because axe could not determine compliance.
 *
 * Product Preview contains non-functional decorative action mockups.
 * They are hidden from the accessibility tree and intentionally styled
 * as inactive. Their decorative text is excluded from contrast checks.
 */
const WCAG_21_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const DECORATIVE_PREVIEW_ACTIONS = ".admin-product-preview__actions";

// CSS transitions can temporarily produce intermediate colors that fail contrast checks.
// Wait for finite animations before scanning; infinite loading animations are excluded.
// Cancelled animations reject their finished promise, so use allSettled.
async function waitForFiniteAnimations(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const finiteAnimations = document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().endTime !== Infinity);

    await Promise.allSettled(finiteAnimations.map((animation) => animation.finished));
  });
}

export async function expectNoAccessibilityViolations(
  page: Page,
  testInfo: TestInfo,
): Promise<void> {
  await waitForFiniteAnimations(page);

  const results = await new AxeBuilder({ page })
    .withTags(WCAG_21_AA_TAGS)
    .exclude(DECORATIVE_PREVIEW_ACTIONS)
    .analyze();

  if (results.incomplete.length > 0) {
    await testInfo.attach("axe-incomplete-results", {
      body: JSON.stringify(results.incomplete, null, 2),
      contentType: "application/json",
    });
  }

  if (results.violations.length === 0) {
    return;
  }

  await testInfo.attach("axe-accessibility-results", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });

  const violationSummary = results.violations
    .map((violation, index) => {
      const targets = violation.nodes
        .flatMap((node) => node.target)
        .map((target) => `    - ${typeof target === "string" ? target : JSON.stringify(target)}`)
        .join("\n");

      return [
        `${index + 1}. ${violation.id} [${violation.impact ?? "impact not reported"}]`,
        violation.help,
        violation.description,
        violation.helpUrl,
        "Targets:",
        targets,
      ].join("\n");
    })
    .join("\n\n");

  throw new Error(`Accessibility violations: ${results.violations.length}\n\n${violationSummary}`);
}
