// Resolves a requested regression selection into the jobs that actually need to start.
//
// FEATURE and SMOKE_ONLY are already applied by the Playwright configs, so this script
// only counts what Playwright lists for each execution group (api-db, ui, integrated).
// database-setup is excluded from the counts: it is listed whenever an integrated
// project is selected, even when no product test matches.
// Counting uses one browser, because the browser choice does not change which tests
// are selected, only where they run.
//
// Fails when the whole selection is empty, so a run can never pass with zero tests.
import { appendFileSync } from "node:fs";

import { getSelectedBrowsers } from "../src/config/playwright.shared";
import { isInfrastructureSpec, listSpecs } from "./playwright-inventory";

const Scope = {
  All: "all",
  ApiDb: "api-db",
  Ui: "ui",
  Integrated: "integrated",
} as const;

type Scope = (typeof Scope)[keyof typeof Scope];

const SUPPORTED_SCOPES: Scope[] = Object.values(Scope);

const getSelectedScope = (): Scope => {
  const scopeValue = process.env.SCOPE ?? Scope.All;

  const scope = SUPPORTED_SCOPES.find((supportedScope) => supportedScope === scopeValue);

  if (scope === undefined) {
    throw new Error(
      `Unsupported SCOPE: "${scopeValue}". Supported: ${SUPPORTED_SCOPES.join(", ")}`,
    );
  }

  return scope;
};

const countProductSpecs = (configFile: string, projects: string[]): number =>
  listSpecs(configFile, {
    projects,
    passWithNoTests: true,
  }).filter((spec) => !isInfrastructureSpec(spec)).length;

const writeGitHubOutput = (name: string, value: number | boolean): void => {
  const githubOutput = process.env.GITHUB_OUTPUT;

  if (githubOutput === undefined) {
    return;
  }

  appendFileSync(githubOutput, `${name}=${value}\n`);
};

const scope = getSelectedScope();

const includesApiDb = scope === Scope.All || scope === Scope.ApiDb;
const includesUi = scope === Scope.All || scope === Scope.Ui;
const includesIntegrated = scope === Scope.All || scope === Scope.Integrated;

const apiDbCount = includesApiDb ? countProductSpecs("playwright.config.ts", ["api", "db"]) : 0;

let uiCount = 0;
let integratedCount = 0;

if (includesUi || includesIntegrated) {
  // getSelectedBrowsers() either returns at least one browser or throws
  // for an invalid explicit BROWSERS value.
  const [representativeBrowser] = getSelectedBrowsers();

  if (includesUi) {
    uiCount = countProductSpecs("playwright.ui.config.ts", [`ui-${representativeBrowser}`]);
  }

  if (includesIntegrated) {
    integratedCount = countProductSpecs("playwright.config.ts", [
      `hybrid-${representativeBrowser}`,
      `e2e-${representativeBrowser}`,
    ]);
  }
}

const totalCount = apiDbCount + uiCount + integratedCount;

if (totalCount === 0) {
  console.error(
    `No product tests match selection: ` +
      `SCOPE=${scope}, ` +
      `FEATURE=${process.env.FEATURE ?? "all"}, ` +
      `SMOKE_ONLY=${process.env.SMOKE_ONLY ?? "false"}`,
  );

  process.exitCode = 1;
} else {
  writeGitHubOutput("run_api_db", apiDbCount > 0);
  writeGitHubOutput("run_ui", uiCount > 0);
  writeGitHubOutput("run_integrated", integratedCount > 0);

  writeGitHubOutput("api_db_count", apiDbCount);
  writeGitHubOutput("ui_count", uiCount);
  writeGitHubOutput("integrated_count", integratedCount);
  writeGitHubOutput("total_count", totalCount);

  console.log(
    `Selection resolved: ${totalCount} product tests ` +
      `(api-db=${apiDbCount}, ui=${uiCount}, integrated=${integratedCount}).`,
  );
}
