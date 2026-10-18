# NovaShop Test Automation Strategy

This document explains how NovaShop is tested and why. It describes the automation that exists in this repository today, the rules behind it, and the decisions about what is not automated.

## 1. Scope

NovaShop is a full-stack web shop built as a test target:

- **Frontend:** React, TypeScript, Redux Toolkit, React Router, Vite.
- **Backend:** Express, TypeScript, PostgreSQL, JWT authentication.
- **Automation:** Playwright and TypeScript, in [`automation/`](../automation).

Covered features: authentication, application shell (navigation, routing, 404), catalog, product details, add to cart, cart, checkout, order history and admin product management.

The automation checks the application through its HTTP API and the browser. Where an HTTP response cannot prove an effect, tests also access the test database directly.

## 2. Core idea: what a test proves and how it runs are separate decisions

A browser test is not automatically a test with a mocked backend, and a test with a real backend is not automatically an end-to-end test. Every test is described by two independent choices.

**What the test proves:**

| Subject               | Example risk                                                             |
| --------------------- | ------------------------------------------------------------------------ |
| Backend contract      | `POST /orders` accepts a valid payload and returns the correct order     |
| Database effect       | an order and its items are saved atomically and stock is reduced         |
| Frontend logic        | a form shows a client-side error and focuses the first invalid field     |
| Frontend routing      | a guest is redirected from a protected page to login                     |
| Frontend/backend seam | the login form sends the right payload and understands the real response |
| User journey          | a user signs in, adds a product and places an order                      |

**How the test creates its conditions:**

| Execution               | Meaning                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| No network              | the check ends before any request, for example client validation                                                   |
| Mocked response         | Playwright returns a prepared HTTP response                                                                        |
| Held real request       | Playwright holds a real request, the test checks the pending state, then the request continues to the real backend |
| API setup, then UI      | state is created through the API, then the browser checks the result                                               |
| Real backend through UI | the browser sends real requests and gets real responses                                                            |

The risk and the subject come first. Then the test uses the cheapest way to create the conditions without losing what it must prove.

## 3. Test layers

| Layer             | Playwright project | Backend and DB | Responsibility                                                                                                               |
| ----------------- | ------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| API               | `api`              | real           | HTTP contract: status codes, response shape, server validation, authentication, authorization, ownership, business errors    |
| DB                | `db`               | real           | effects that one HTTP response cannot prove: soft delete, password hashing, transaction behavior under concurrency           |
| Isolated UI       | `ui-<browser>`     | **none**       | frontend behavior: rendering, client validation, focus, loading, empty and error states, local state, routing, accessibility |
| Hybrid            | `hybrid-<browser>` | real           | frontend behavior that depends on a real identity or real server state; state is prepared through the API                    |
| E2E               | `e2e-<browser>`    | real           | a few critical journeys through the full stack                                                                               |
| Post-deploy smoke | separate config    | live demo      | the deployed demo works after each deployment                                                                                |

API and DB tests do not use a browser and run once. Isolated UI, Hybrid and E2E tests run once per selected browser. Current numbers are in the [published Playwright report](https://alitsman.github.io/novashop/).

### API

The API layer owns input matrices and error codes: boundary values, invalid types, missing fields, role checks, ownership, and attempts to send server-controlled values such as `userId`, `role` or `orderNumber`. Key responses are also validated with runtime schemas (see section 5.3).

A green API test does not prove that the frontend calls the right endpoint, sends the right payload or handles the response. A green browser journey does not prove the full status-code matrix. The layers complement each other.

### DB

DB tests access the database directly only when the HTTP response cannot prove the effect. Examples:

- a deleted product keeps its row and gets `deleted_at`;
- passwords are stored only as bcrypt hashes, and the same password gives different hashes;
- a race for the last item: a competing transaction sells it and keeps its row lock open; the test confirms through PostgreSQL that the API order is waiting on that lock, then commits the competing sale; the order sees the committed stock and returns `INSUFFICIENT_STOCK` without overselling.

### Isolated UI

Isolated UI tests start only the frontend. No backend and no database run in this project.

- Every API response the test needs is mocked.
- A fixture blocks every other request to the API origin and fails the test with the list of unexpected requests. A missing mock cannot silently reach a real server.
- Image requests are blocked, because image content is outside the test scope.

A failure in this project therefore points to the frontend or to the test itself, not to the backend.

This is the largest browser layer on purpose. Most frontend risks are about states: loading, empty, error, validation, focus, a price or stock change between the cart and checkout. With a real backend these states are slow, fragile or impossible to create on demand. Isolated tests create each state exactly, run without a database and give a clear signal. The real backend is still covered: by the API layer, and by Hybrid and E2E tests on every critical path.

### Hybrid

Hybrid tests use the real backend and database but skip UI steps that are not the subject of the test. A typical hybrid test gets a real token through the API, puts it into browser storage and opens the target page. Examples: session restoration with an invalid stored token, cart isolation when two real users switch in one browser, pending state of real login and registration requests.

### E2E

E2E stays small. Each test proves that the parts work together on a critical path: login and registration with session restore after reload, the full purchase journey up to the new order in the order history, duplicate-submit protection with stock refresh, and admin create, update and delete with the result visible in the customer catalog. Variations stay in the API and Isolated UI layers.

## 4. Choosing a layer

Before a test is written, these questions are answered:

1. What risk does the test close? It is described as a consequence, not an action: not "check the login form", but "a user with valid credentials cannot sign in because the frontend sends a wrong payload".
2. Where does the risk live: backend, frontend, database, the seam between them, or the full journey?
3. What is the cheapest test that fully proves it?
   - server validation → API;
   - client validation → Isolated UI without a request;
   - a rare frontend error state → Isolated UI with a controlled response;
   - real role, identity or server state → Hybrid;
   - compatibility of real parts → E2E.
4. If Hybrid or E2E is chosen: why is a cheaper layer not enough?
5. Is this risk already covered somewhere else?

### One owner per risk

Each risk has one main owner layer:

| Risk                                                  | Main owner  |
| ----------------------------------------------------- | ----------- |
| Server validation matrix                              | API         |
| Role and ownership enforcement                        | API         |
| Persistence and transactions                          | DB          |
| Client validation and focus                           | Isolated UI |
| Frontend handling of loading, empty and error states  | Isolated UI |
| Real identity and session behavior                    | Hybrid      |
| Request and response compatibility on a critical path | E2E         |

The same user action can appear in several layers only when each layer proves something different. Login is an example: the API proves status, body and token; Isolated UI proves that an empty form sends no request; E2E proves that the real form gets a real token and restores the session after reload. These are three different proofs, not three copies of one test.

Client-side route guards improve navigation, but they are not a security boundary. Security is proven by backend authorization tests in the API layer.

### No blind spots

Avoiding duplicates does not mean one test per feature. For each critical operation there are three owners: the backend accepts or rejects and changes data, the frontend shows the right states, and at least one real path proves that both sides work together. Critical frontend/backend interactions are covered by Hybrid or E2E tests.

## 5. Real backend and mocks

### 5.1 When the real backend is required

The real backend is used when the subject of the test includes the HTTP contract, real request or response serialization, the JWT lifecycle, roles, ownership, persistence or server-side business logic such as stock and totals.

Mocking a happy path "for speed" creates a second, imaginary system. Such a test stays green when an endpoint is renamed, a field changes or the error format changes.

### 5.2 When a mock is justified

A mocked response (`route.fulfill()`) is used when it gives control over a frontend state that the real backend cannot produce reliably, or only with expensive and fragile setup, and the mock does not replace the subject of the test. Examples:

- network failure or server error, to check frontend recovery;
- a request that never finishes, to check the loading state;
- an empty catalog, which would otherwise require emptying the shared database;
- a fixed product set for client-side search and filtering;
- a race between catalog data and the cart, for example a price or stock change just before checkout.

A mock is never used for the subject of an integration test. A test with a mocked response never claims that the real integration works.

### 5.3 Mocks follow the real contract

Shared mock helpers validate their responses with the same runtime schemas (zod) used for real API responses in API tests ([`automation/src/schemas`](../automation/src/schemas)). Invalid data supplied through those helpers fails schema validation before the mock is registered. This helps prevent mock contract drift but does not turn a mock into proof of the real backend contract.

### 5.4 Holding a request without faking it

Pending states and double-submit protection are tested by holding a request, not by faking time. The shared helper [`held-request.helper.ts`](../automation/src/helpers/held-request.helper.ts):

- intercepts one exact API URL and method;
- signals when the request is observed;
- holds it while the test checks the loading state, the disabled button and the request count;
- releases it to the real backend (Hybrid, E2E) or answers with a prepared mock (Isolated UI);
- releases automatically after a deadline with a clear error, so a request is never left hanging.

Routes always use the exact API URL. A broad pattern such as `**/products` would also catch the page navigation to `/products` and return JSON instead of HTML.

## 6. Test data and isolation

### 6.1 The test database is protected

- Integrated tests use only a database named `novashop_test`. Reset, migration and test seed scripts check the name first and stop for any other database.
- The `database-setup` project recreates the schema, runs migrations and seeds the test data before the API, DB, Hybrid and E2E projects.
- The DB fixture checks `current_database()` and refuses to work with any other database.

### 6.2 Seed data is read-only

The test seed creates two known accounts and a fixed catalog, including one soft-deleted product. Tests may sign in as these users and read this data. Tests never change, order or delete seeded entities.

### 6.3 Tests create their own data

A test that changes data creates its own entities through the API: users with unique emails, products with server-generated ids, orders on its own products with known stock. Tests do not depend on global counts or on the order in which they run. Spec files run in parallel workers.

### 6.4 Browser isolation

Every test gets a new browser context, so storage and cookies are never shared. Browser storage is prepared directly only for data the real frontend keeps there: the auth token and the user's cart.

### 6.5 Environments are separated

Regression never uses the public demo. The demo has its own database, and its secrets are stored in a separate GitHub environment that regression jobs do not use. CI uses its own throwaway JWT secret.

## 7. Locators, assertions and stability

- Locators use roles, labels, accessible names and visible text. `data-testid` is used only where there is no stable user-facing meaning.
- Page objects and component objects live in [`automation/src/pages`](../automation/src/pages) and [`automation/src/components`](../automation/src/components).
- Assertions are web-first. Tests wait for business states, never for fixed time.
- Request counts are asserted only where the number of requests matters for the data: invalid input must send no request, and one submit must create exactly one order or account. Tests do not count requests to pin down how the frontend is built.
- Traces and screenshots are kept for failed tests. Post-deploy smoke tests use a stricter policy (see section 10).
- Every product test has at least one feature tag from a central registry ([`test-tags.ts`](../automation/src/config/test-tags.ts)). A CI check rejects untagged tests and unknown tags. The `database-setup` project is infrastructure and has no tags.

## 8. Accessibility

Accessibility is part of functional behavior:

- functional tests check focus on the first invalid field, label and control association, `role="alert"` and status messages, disabled and busy states during submit, and keyboard handling of dialogs;
- automated scans (tag `@suite-a11y`) run axe-core with WCAG 2.1 Level A and AA rules on every page and on important states such as validation errors and open dialogs.

Rules of the scans:

- every violation fails the test, whatever its impact;
- axe "incomplete" results do not fail the test; they are attached to the report for manual review;
- before a scan, the helper waits for finished CSS animations, because a running transition can produce a false contrast failure;
- one decorative element is excluded from contrast checks: inactive action mockups in the admin product preview, which are hidden from assistive technology.

Automated scans find only part of WCAG issues. They do not replace manual testing with a screen reader.

## 9. Cross-browser execution

Browser tests run in Chromium, Firefox and WebKit. Pull requests run Chromium only; nightly and manual full regression run all three browsers.

Some tests are skipped in one browser on purpose. Each skip is written in the test code with its reason, and the report shows it as skipped, not as passed. The skipped behavior is not claimed as tested in that browser.

| Scenario                                 | Skipped in      | Reason                                                                                                |
| ---------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| Hidden control characters in text fields | Firefox         | Firefox removes control characters during typing, so this validation cannot be reached through the UI |
| Pasting a quantity from the clipboard    | Firefox, WebKit | the test needs clipboard permissions, which are set up only in the Chromium project                   |
| Moving keyboard focus with the skip link | WebKit          | in Playwright WebKit, Tab does not move focus to links in this environment                            |

## 10. CI/CD

All regression runs use one reusable workflow, [`regression.yml`](../.github/workflows/regression.yml). Browser jobs run in the official Playwright container that matches the installed Playwright version, so browsers are not installed on every run.

| Workflow                   | Trigger                          | What runs                                                                | Browsers   | Retries        |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------ | ---------- | -------------- |
| CI                         | pull request, push to `main`     | quality checks, API + DB, Isolated UI, Hybrid + E2E, Docker verification | Chromium   | 0              |
| Nightly Full Regression    | daily, manual                    | everything; the merged report is published to GitHub Pages               | all three  | 1, flaky fails |
| Manual Full Regression     | manual                           | everything                                                               | all three  | 1, flaky fails |
| Smoke                      | manual                           | tests tagged `@suite-smoke`                                              | selectable | 0              |
| Manual Targeted Regression | manual                           | selected scopes and features                                             | selectable | 0              |
| Deploy Demo                | after green CI on `main`, manual | deploy, version check, post-deploy smoke                                 | Chromium   | 0              |

Details:

- **Quality** runs lint, formatting and a type-checked build for the frontend and backend, and type check, lint, formatting and the tag check for automation.
- **Selection.** Before tests start, a script lists the tests for the requested scopes and features and starts only the jobs that have tests. A selection with zero tests fails instead of passing empty.
- **Merge gate.** `main` is protected. The required checks are `Regression gate`, which passes only when every regression job passed, and `Docker verification`, which builds the images, starts the stack with Docker Compose and checks health, CORS, repeated migrations and two migration runs started at the same time.
- **Flaky policy.** Pull requests run without retries, so a flaky test fails the gate. Full regression allows one retry only to collect diagnostics; `--fail-on-flaky-tests` still fails the run when a test passes only on retry.
- **Reports.** Every job uploads a blob report. One job merges them into a single HTML report. Nightly publishes its merged report to GitHub Pages, also when tests fail.

### Post-deploy smoke

The demo deployment workflow checks that both deployed parts serve the merged commit, then runs a small smoke suite against the live demo:

- API: database health, catalog read, login and `/me`, and a regular user cannot create a product;
- UI: real catalog, direct product URL on the static host, sign in through the frontend, guest redirect from a protected page.

The smoke tests do not change data and never sign in as admin. A dedicated smoke account is stored as a secret. Traces are disabled and CI uses the list reporter to minimize the risk of exposing credentials in test artifacts. Only failure screenshots are uploaded.

See [deployment.md](deployment.md) for the deployment itself.

## 11. Coverage boundaries

### Out of scope

These are deliberate decisions, not unfinished work:

| Area                                        | Decision                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit and component tests                    | This project tests the application through its API, the browser and the database. Unit tests belong to the developers' layer. A timing race in the catalog search was found and fixed during browser testing; deterministic regression coverage of that specific race was not added. |
| Browser boundaries already owned by the API | For example, the maximum of 100 different products in one order is checked at the API level, not repeated in the browser.                                                                                                                                                            |
| Every malformed request variation           | One API test for each body-parser error category: `INVALID_JSON` and `PAYLOAD_TOO_LARGE`.                                                                                                                                                                                            |
| Visual regression and performance testing   | Not part of this project.                                                                                                                                                                                                                                                            |
| Full manual accessibility audit             | Automated scans cover only part of WCAG; screen reader testing is manual.                                                                                                                                                                                                            |

### Known limitations of the application

The application has risks that tests document but do not remove:

- **No rate limiting.** Login and registration do not limit repeated requests from one client, so password guessing is not slowed down by the server.
- **No token revocation.** A JWT stays valid for 7 days. Logout removes it only from the browser, and a role change takes effect only after a new login.
- **No order idempotency.** `POST /orders` has no idempotency key. Duplicate submission is blocked within a single browser tab, but concurrent submissions from different tabs or a retry after a lost response can create duplicate orders. Database transactions and row-level locks prevent overselling but do not prevent duplicate orders.
