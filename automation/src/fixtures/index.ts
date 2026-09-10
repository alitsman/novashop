import { expect, mergeTests } from "@playwright/test";

import { test as backendRequestTest } from "./backend-request.fixture";
import { test as databaseTest } from "./database.fixture";
import { test as uiTest } from "./ui.fixture";

export const test = mergeTests(backendRequestTest, databaseTest, uiTest);

export { expect };
