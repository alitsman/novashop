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
import { execSync } from "node:child_process";

import { z } from "zod";

import { FeatureTag, SuiteTag } from "../src/config/test-tags";

const PLAYWRIGHT_CONFIGS = ["playwright.config.ts", "playwright.ui.config.ts"];
const INFRASTRUCTURE_PROJECTS = ["database-setup"];

// The JSON list of ~400 tests is larger than the default 1 MB output buffer.
const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

// Playwright's JSON report stores tags without the leading "@":
// "@feature-auth" in the registry is "feature-auth" in the report.
const toReportTag = (tag: string): string => tag.slice(1);

const FEATURE_TAGS: string[] = Object.values(FeatureTag).map(toReportTag);
const SUITE_TAGS: string[] = Object.values(SuiteTag).map(toReportTag);
const ALLOWED_TAGS: string[] = [...FEATURE_TAGS, ...SUITE_TAGS];

// Only the fields this check needs. The report is external data, so it is validated
// before use, like API responses elsewhere in the project.
const listedSpecSchema = z.object({
  title: z.string(),
  file: z.string(),
  line: z.number(),
  tags: z.array(z.string()),
  tests: z.array(z.object({ projectName: z.string() })).min(1),
});

type ListedSuite = {
  specs?: ListedSpec[];
  suites?: ListedSuite[];
};

type ListedSpec = z.infer<typeof listedSpecSchema>;

const listedSuiteSchema: z.ZodType<ListedSuite> = z.lazy(() =>
  z.object({
    specs: z.array(listedSpecSchema).optional(),
    suites: z.array(listedSuiteSchema).optional(),
  }),
);

const listReportSchema = z.object({
  suites: z.array(listedSuiteSchema),
});

const collectSpecs = (suite: ListedSuite, specs: ListedSpec[]): void => {
  specs.push(...(suite.specs ?? []));

  for (const childSuite of suite.suites ?? []) {
    collectSpecs(childSuite, specs);
  }
};

const listSpecs = (configFile: string): ListedSpec[] => {
  const output = execSync(`npx playwright test --list --reporter=json --config=${configFile}`, {
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT_BYTES,
  });

  const report = listReportSchema.parse(JSON.parse(output));
  const specs: ListedSpec[] = [];

  for (const suite of report.suites) {
    collectSpecs(suite, specs);
  }

  return specs;
};

const isInfrastructureSpec = (spec: ListedSpec): boolean =>
  spec.tests.every((test) => INFRASTRUCTURE_PROJECTS.includes(test.projectName));

const errors: string[] = [];
let checkedSpecCount = 0;

for (const configFile of PLAYWRIGHT_CONFIGS) {
  for (const spec of listSpecs(configFile)) {
    checkedSpecCount += 1;

    const location = `${spec.file}:${spec.line} › ${spec.title}`;

    for (const tag of spec.tags) {
      if (!ALLOWED_TAGS.includes(tag)) {
        errors.push(`${location}: unknown tag "@${tag}"`);
      }
    }

    const infrastructureSpec = isInfrastructureSpec(spec);

    if (infrastructureSpec) {
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
