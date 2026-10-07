// Reads the list of tests from Playwright without running them.
// Shared by the tag check and the targeted-run selection check, so both scripts
// see tests exactly as Playwright resolves them, including inherited describe tags.
import { execSync } from "node:child_process";

import { z } from "zod";

const INFRASTRUCTURE_PROJECTS = ["database-setup"];

// The JSON list of ~400 tests is larger than the default 1 MB output buffer.
const MAX_OUTPUT_BYTES = 50 * 1024 * 1024;

// Only the fields the scripts need. The report is external data, so it is validated
// before use, like API responses elsewhere in the project.
const listedSpecSchema = z.object({
  title: z.string(),
  file: z.string(),
  line: z.number(),
  tags: z.array(z.string()),
  tests: z.array(z.object({ projectName: z.string() })).min(1),
});

export type ListedSpec = z.infer<typeof listedSpecSchema>;

type ListedSuite = {
  specs?: ListedSpec[];
  suites?: ListedSuite[];
};

const listedSuiteSchema: z.ZodType<ListedSuite> = z.lazy(() =>
  z.object({
    specs: z.array(listedSpecSchema).optional(),
    suites: z.array(listedSuiteSchema).optional(),
  }),
);

const listReportSchema = z.object({
  suites: z.array(listedSuiteSchema),
});

type ListSpecsOptions = {
  projects?: string[];
  env?: NodeJS.ProcessEnv;
  passWithNoTests?: boolean;
};

const collectSpecs = (suite: ListedSuite, specs: ListedSpec[]): void => {
  specs.push(...(suite.specs ?? []));

  for (const childSuite of suite.suites ?? []) {
    collectSpecs(childSuite, specs);
  }
};

export const listSpecs = (
  configFile: string,
  { projects = [], env = process.env, passWithNoTests = false }: ListSpecsOptions = {},
): ListedSpec[] => {
  const commandParts = [
    "npx playwright test",
    "--list",
    "--reporter=json",
    `--config=${configFile}`,
    ...projects.map((project) => `--project=${project}`),
  ];

  if (passWithNoTests) {
    commandParts.push("--pass-with-no-tests");
  }

  const output = execSync(commandParts.join(" "), {
    encoding: "utf8",
    maxBuffer: MAX_OUTPUT_BYTES,
    env,
  });

  const report = listReportSchema.parse(JSON.parse(output));
  const specs: ListedSpec[] = [];

  for (const suite of report.suites) {
    collectSpecs(suite, specs);
  }

  return specs;
};

export const isInfrastructureSpec = (spec: ListedSpec): boolean =>
  spec.tests.every((test) => INFRASTRUCTURE_PROJECTS.includes(test.projectName));
