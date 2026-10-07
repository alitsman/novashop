import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import type { PlaywrightTestConfig } from "@playwright/test";

import { FeatureTag, SuiteTag } from "./test-tags";

export const Browser = {
  Chromium: "chromium",
  Firefox: "firefox",
  Webkit: "webkit",
} as const;

export type Browser = (typeof Browser)[keyof typeof Browser];

const DEFAULT_BROWSER = Browser.Chromium;
const SUPPORTED_BROWSERS: Browser[] = Object.values(Browser);

// Reads the BROWSERS variable, e.g. BROWSERS="firefox,webkit".
// Without BROWSERS the tests run in Chromium only.
export const getSelectedBrowsers = (): Browser[] => {
  const browsersValue = process.env.BROWSERS;

  if (browsersValue === undefined) {
    return [DEFAULT_BROWSER];
  }

  const selectedBrowsers: Browser[] = [];

  for (const rawName of browsersValue.split(",")) {
    const name = rawName.trim();

    if (name === "") {
      continue;
    }

    const browser = SUPPORTED_BROWSERS.find((supportedBrowser) => supportedBrowser === name);

    if (browser === undefined) {
      throw new Error(
        `Unsupported browser in BROWSERS: "${name}". Supported: ${SUPPORTED_BROWSERS.join(", ")}`,
      );
    }

    if (!selectedBrowsers.includes(browser)) {
      selectedBrowsers.push(browser);
    }
  }

  if (selectedBrowsers.length === 0) {
    throw new Error(
      `BROWSERS is set but lists no browsers. Supported: ${SUPPORTED_BROWSERS.join(", ")}`,
    );
  }

  return selectedBrowsers;
};

const FEATURE_TAG_PREFIX = "@feature-";

// A tag must end here, so "@feature-product" never matches "@feature-product-details".
const TAG_END_PATTERN = "(?![A-Za-z0-9_-])";

const SUPPORTED_FEATURES = Object.values(FeatureTag).map((tag) =>
  tag.replace(FEATURE_TAG_PREFIX, ""),
);

// Reads the FEATURE variable, e.g. FEATURE="checkout".
// Without FEATURE, or with FEATURE="all", tests of every feature are selected.
const getSelectedFeatureTag = (): string | undefined => {
  const featureValue = process.env.FEATURE;

  if (featureValue === undefined || featureValue === "all") {
    return undefined;
  }

  const featureTag = Object.values(FeatureTag).find(
    (tag) => tag === `${FEATURE_TAG_PREFIX}${featureValue}`,
  );

  if (featureTag === undefined) {
    throw new Error(
      `Unsupported FEATURE: "${featureValue}". Supported: all, ${SUPPORTED_FEATURES.join(", ")}`,
    );
  }

  return featureTag;
};

// Reads the SMOKE_ONLY variable. GitHub Actions passes booleans as "true" or "false",
// so both forms are accepted.
const isSmokeOnly = (): boolean => {
  const smokeOnlyValue = process.env.SMOKE_ONLY;

  if (smokeOnlyValue === undefined || smokeOnlyValue === "0" || smokeOnlyValue === "false") {
    return false;
  }

  if (smokeOnlyValue === "1" || smokeOnlyValue === "true") {
    return true;
  }

  throw new Error(`Unsupported SMOKE_ONLY: "${smokeOnlyValue}". Supported: 0, 1, false, true`);
};

// Builds the Playwright grep for FEATURE and SMOKE_ONLY.
// Each required tag becomes a lookahead, so a test must have all of them.
// Configs apply this grep to product test projects only, never to database-setup.
export const getTestSelectionGrep = (): RegExp | undefined => {
  const requiredTags: string[] = [];

  const selectedFeatureTag = getSelectedFeatureTag();

  if (selectedFeatureTag !== undefined) {
    requiredTags.push(selectedFeatureTag);
  }

  if (isSmokeOnly()) {
    requiredTags.push(SuiteTag.Smoke);
  }

  if (requiredTags.length === 0) {
    return undefined;
  }

  const lookaheads = requiredTags.map((tag) => `(?=.*${tag}${TAG_END_PATTERN})`);

  return new RegExp(`^${lookaheads.join("")}`);
};

const testEnvPath = new URL("../../../.env.test", import.meta.url);

// Local runs use the file; CI supplies the same variables through process.env.
if (existsSync(testEnvPath)) {
  loadEnvFile(testEnvPath);
}

export const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getExplicitUrlPort = (name: string, value: string): string => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid absolute URL`);
  }

  if (!url.port) {
    throw new Error(`${name} must include an explicit port while Playwright starts local servers`);
  }

  return url.port;
};

export const frontendUrl = getRequiredEnv("FRONTEND_URL");
export const apiUrl = getRequiredEnv("API_URL");

const viteApiUrl = getRequiredEnv("VITE_API_URL");

export const frontendPort = getExplicitUrlPort("FRONTEND_URL", frontendUrl);
export const apiPort = getExplicitUrlPort("API_URL", apiUrl);

if (viteApiUrl !== apiUrl) {
  throw new Error(`VITE_API_URL (${viteApiUrl}) must match API_URL (${apiUrl})`);
}

type SharedConfigOptions = {
  outputDir: string;
  htmlOutputFolder: string;
};

export const createSharedConfig = ({
  outputDir,
  htmlOutputFolder,
}: SharedConfigOptions): PlaywrightTestConfig => ({
  testDir: "./tests",

  forbidOnly: !!process.env.CI,

  retries: 0,

  outputDir,

  reporter: [["list"], ["html", { open: "never", outputFolder: htmlOutputFolder }]],

  use: {
    baseURL: frontendUrl,
    screenshot: "only-on-failure",
    viewport: {
      width: 1280,
      height: 720,
    },
    trace: "retain-on-failure",
  },
});
