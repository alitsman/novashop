// Checks that every test is tagged correctly.
//
// Rules:
// 1. Every product test has at least one feature tag.
// 2. Every tag on every test exists in the central registry (src/config/test-tags.ts).
// 3. database-setup is infrastructure and must not have any tags.
//
// Tags are read from Playwright's JSON test list rather than from the source files.
// The list contains the effective tags of each test, including tags inherited from
// test.describe(), which is the same view Playwright uses when it selects tests.
import { FeatureTag, SuiteTag } from "../src/config/test-tags";
import { isInfrastructureSpec, listSpecs } from "./playwright-inventory";

const PLAYWRIGHT_CONFIGS = ["playwright.config.ts", "playwright.ui.config.ts"];

// Playwright's JSON report stores tags without the leading "@":
// "@feature-auth" in the registry is "feature-auth" in the report.
const toReportTag = (tag: string): string => tag.slice(1);

const FEATURE_TAGS: string[] = Object.values(FeatureTag).map(toReportTag);
const SUITE_TAGS: string[] = Object.values(SuiteTag).map(toReportTag);
const ALLOWED_TAGS: string[] = [...FEATURE_TAGS, ...SUITE_TAGS];

// The check must always see the complete test list, even if FEATURE, SMOKE_ONLY
// or BROWSERS are left set in the local shell from a targeted run.
const FULL_INVENTORY_ENV: NodeJS.ProcessEnv = {
  ...process.env,
  BROWSERS: "chromium",
  FEATURE: "all",
  SMOKE_ONLY: "false",
};

const errors: string[] = [];
let checkedSpecCount = 0;

for (const configFile of PLAYWRIGHT_CONFIGS) {
  for (const spec of listSpecs(configFile, { env: FULL_INVENTORY_ENV })) {
    checkedSpecCount += 1;

    const location = `${spec.file}:${spec.line} > ${spec.title}`;

    for (const tag of spec.tags) {
      if (!ALLOWED_TAGS.includes(tag)) {
        errors.push(`${location}: unknown tag "@${tag}"`);
      }
    }

    if (isInfrastructureSpec(spec)) {
      if (spec.tags.length > 0) {
        errors.push(`${location}: infrastructure test must not have tags`);
      }

      continue;
    }

    const hasFeatureTag = spec.tags.some((tag) => FEATURE_TAGS.includes(tag));

    if (!hasFeatureTag) {
      errors.push(`${location}: missing feature tag`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(
    `\nTest tag check failed: ${errors.length} problem(s) in ${checkedSpecCount} tests.`,
  );
  process.exitCode = 1;
} else {
  console.log(`Test tag check passed: ${checkedSpecCount} tests.`);
}
