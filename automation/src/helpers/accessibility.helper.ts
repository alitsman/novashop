import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;
type AxeResult = AxeResults["violations"][number];
type AxeNode = AxeResult["nodes"][number];

/**
 * Runs WCAG 2.1 Level A and AA automated accessibility checks.
 *
 * Every reported violation fails the test regardless of impact severity.
 * The complete axe results are attached to the Playwright report on failure.
 *
 * Incomplete results do not fail the test because axe could not determine
 * compliance. A readable summary and complete JSON are attached for manual
 * investigation.
 *
 * Product Preview contains non-functional decorative action mockups.
 * They are hidden from the accessibility tree and intentionally styled
 * as inactive. Their decorative text is excluded from contrast checks.
 */
const WCAG_21_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

const WCAG_STANDARD_BY_TAG = new Map<string, string>([
  ["wcag2a", "WCAG 2.0 Level A"],
  ["wcag2aa", "WCAG 2.0 Level AA"],
  ["wcag21a", "WCAG 2.1 Level A"],
  ["wcag21aa", "WCAG 2.1 Level AA"],
]);

const MAX_NODES_PER_RESULT = 5;

const DECORATIVE_PREVIEW_ACTIONS = ".admin-product-preview__actions";

function formatWcagStandards(tags: readonly string[]): string {
  const standards = tags
    .map((tag) => WCAG_STANDARD_BY_TAG.get(tag))
    .filter((standard): standard is string => standard !== undefined);

  const uniqueStandards = [...new Set(standards)];

  return uniqueStandards.length > 0 ? uniqueStandards.join(", ") : "not reported";
}

function formatWcagCriteria(tags: readonly string[]): string {
  const criteria = tags
    .filter((tag) => /^wcag\d{3,}$/.test(tag))
    .map((tag) => {
      const digits = tag.slice("wcag".length);

      return `${digits.slice(0, 1)}.${digits.slice(1, 2)}.${digits.slice(2)}`;
    });

  const uniqueCriteria = [...new Set(criteria)];

  return uniqueCriteria.length > 0 ? uniqueCriteria.join(", ") : "not reported";
}

function formatNodes(nodes: readonly AxeNode[]): string {
  const shownNodes = nodes.slice(0, MAX_NODES_PER_RESULT).map((node) => {
    const target =
      node.target
        .map((selector) => (typeof selector === "string" ? selector : JSON.stringify(selector)))
        .join(" > ") || "target not reported";

    const html = node.html.replace(/\s+/g, " ").trim();
    const reason = (node.failureSummary ?? "Reason not reported.").replaceAll("\n", "\n      ");

    return [`  - Target: ${target}`, `    HTML: ${html}`, `    Reason: ${reason}`].join("\n");
  });

  const hiddenCount = nodes.length - shownNodes.length;

  if (hiddenCount > 0) {
    shownNodes.push(`  ...and ${hiddenCount} more (see the attached axe results)`);
  }

  return shownNodes.join("\n");
}

function formatAxeResults(results: readonly AxeResult[]): string {
  return results
    .map((result, index) => {
      return [
        `${index + 1}. ${result.id} [${result.impact ?? "impact not reported"}]`,
        `Standard and level: ${formatWcagStandards(result.tags)}`,
        `Success criteria: ${formatWcagCriteria(result.tags)}`,
        result.help,
        result.helpUrl,
        "Elements:",
        formatNodes(result.nodes),
      ].join("\n");
    })
    .join("\n\n");
}

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
    const incompleteSummary = formatAxeResults(results.incomplete);

    await testInfo.attach("axe-incomplete-summary", {
      body: `Incomplete accessibility checks: ${results.incomplete.length}\n\n${incompleteSummary}`,
      contentType: "text/plain",
    });

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

  const violationSummary = formatAxeResults(results.violations);

  throw new Error(`Accessibility violations: ${results.violations.length}\n\n${violationSummary}`);
}
