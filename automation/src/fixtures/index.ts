import { expect, mergeTests } from "@playwright/test";

import { test as databaseTest } from "./database.fixture";
import { test as uiTest } from "./ui.fixture";

export const test = mergeTests(databaseTest, uiTest);

export { expect };
