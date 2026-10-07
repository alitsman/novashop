// Resolves a requested regression selection into the jobs that actually need to start.
//
// FEATURE and SMOKE_ONLY are already applied by the Playwright configs, so this script
// only counts what Playwright lists for each selected execution group (api-db, ui, integrated).
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
  ApiDb: "api-db",
  Ui: "ui",
  Integrated: "integrated",
} as const;

type Scope = (typeof Scope)[keyof typeof Scope];

const ALL_SCOPE_VALUE = "all";
const SUPPORTED_SCOPES: Scope[] = Object.values(Scope);

const getSelectedScopes = (): Scope[] => {
  const scopeValue = process.env.SCOPE ?? ALL_SCOPE_VALUE;

  if (scopeValue === ALL_SCOPE_VALUE) {
    return [...SUPPORTED_SCOPES];
  }

  const rawScopes = scopeValue
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope !== "");

  if (rawScopes.length === 0) {
    throw new Error(
      `SCOPE is set but lists no execution scopes. Supported: ${ALL_SCOPE_VALUE}, ${SUPPORTED_SCOPES.join(", ")}`,
    );
  }

  if (rawScopes.includes(ALL_SCOPE_VALUE)) {
    throw new Error(
      `SCOPE cannot combine "${ALL_SCOPE_VALUE}" with specific scopes. ` +
        `Supported: ${ALL_SCOPE_VALUE}, ${SUPPORTED_SCOPES.join(", ")}`,
    );
  }

  const selectedScopes: Scope[] = [];

  for (const rawScope of rawScopes) {
    const scope = SUPPORTED_SCOPES.find((supportedScope) => supportedScope === rawScope);

    if (scope === undefined) {
      throw new Error(
        `Unsupported SCOPE value: "${rawScope}". ` +
          `Supported: ${ALL_SCOPE_VALUE}, ${SUPPORTED_SCOPES.join(", ")}`,
      );
    }

    if (!selectedScopes.includes(scope)) {
      selectedScopes.push(scope);
    }
  }

  return selectedScopes;
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

const selectedScopes = getSelectedScopes();

const includesApiDb = selectedScopes.includes(Scope.ApiDb);
const includesUi = selectedScopes.includes(Scope.Ui);
const includesIntegrated = selectedScopes.includes(Scope.Integrated);

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
      `SCOPE=${process.env.SCOPE ?? ALL_SCOPE_VALUE}, ` +
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
