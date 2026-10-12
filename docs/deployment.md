# NovaShop Demo Deployment

This document explains where the public NovaShop demo runs, how a new version reaches it, and how automation confirms that the deployed version works.

## 1. Demo hosting

- **Frontend:** https://novashop-demo.pages.dev
- **Backend API:** https://novashop-api-zjj9.onrender.com

| Part     | Platform                 | Notes                                                                                                                                                                                                                        |
| -------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | Cloudflare Pages         | Static build, created in GitHub Actions and uploaded with Wrangler (Direct Upload, no Git integration).                                                                                                                      |
| Backend  | Render, free web service | Docker runtime, built from `backend/Dockerfile` with `backend/` as the build context: the same image as in local Docker Compose. Auto-Deploy is off; deployments start only from the workflow. Health check path: `/health`. |
| Database | Neon, free plan          | PostgreSQL, separate from all test databases.                                                                                                                                                                                |

Cloudflare Pages serves the application. GitHub Pages is used only for the [Nightly Playwright report](https://alitsman.github.io/novashop/).

The demo runs on free plans. It is a showcase, not a production system.

## 2. Automated deployment and verification

The [Deploy Demo workflow](../.github/workflows/deploy-demo.yml) runs after CI passes on `main`. It can also be started manually from `main`.

1. **Validate the commit.** The workflow accepts only a commit from a push to `main` in this repository with a successful CI run. The commit must still be the head of `main`; an older commit is skipped, so the demo never moves back to an outdated version.
2. **Deploy the backend.** The workflow calls the Render deploy hook with the commit SHA.
3. **Confirm the backend version.** It waits until `/health` returns the same commit SHA, then checks `/health/db` to confirm the database connection.
4. **Deploy the frontend.** Only after the backend is confirmed, it builds the frontend with the commit SHA in `<meta name="app-version">` and uploads it to Cloudflare Pages.
5. **Confirm the frontend version.** It waits until the public frontend URL serves the same SHA.
6. **Run post-deploy smoke tests** against the live demo.

### Why the version checks matter

A successful deploy hook call only means that Render accepted the request. A successful upload only means that Cloudflare received the files. Neither proves what visitors receive. The workflow checks the commit SHA on the public URLs of both parts, so a green deployment means that the demo really serves the merged commit.

### Post-deploy smoke

The smoke suite uses its own Playwright config and runs in Chromium:

- API: database health, catalog read, login and `/me`, and a regular user cannot create a product;
- UI: real catalog, direct product URL on Cloudflare Pages, sign in through the frontend, guest redirect from a protected page.

The suite is read-only. It uses a dedicated regular account and never signs in as admin. Before the first test, it waits for a sleeping backend to wake up. Traces are disabled and CI uses the list reporter to minimize the risk of exposing credentials in test artifacts. Only failure screenshots are uploaded. See the [Test Automation Strategy](test-strategy.md) for the test design.

## 3. Configuration and data isolation

- **Render environment variables** hold the backend configuration: `DATABASE_URL`, `JWT_SECRET` and `FRONTEND_URL`, the only allowed CORS origin. Render itself provides `PORT` and `RENDER_GIT_COMMIT`, which `/health` returns as the deployed commit.
- **The GitHub environment `demo`** holds the deployment credentials (Render deploy hook, Cloudflare API token) and the smoke account. Only the deployment and smoke jobs use this environment.
- The demo database connection string and JWT secret are not stored in GitHub. GitHub Actions never connects to the demo database.
- Regression suites never run against the demo. They use a separate database named `novashop_test`, and the test scripts refuse to work with any other database.
- Public test passwords from the repository work only with the test database. The demo has no shared account: visitors register their own, and see only their own orders.

### Migrations

Render's pre-deploy command is not available on the free plan, so the container runs database migrations on start and then starts the server. Applied migrations are recorded and skipped on the next start. A PostgreSQL advisory lock makes two starting containers apply migrations one after another. Docker verification in CI checks this with two parallel migration runs.

## 4. Failure behavior and limitations

- If CI fails, no deployment starts.
- If the backend deployment fails or Render does not serve the new commit in time, the workflow fails before the frontend step. The frontend keeps its previous version.
- A failed migration stops the new container from starting, so the deployment fails. Each migration runs in its own transaction, but migrations applied before the failing one stay in the database. Migrations are therefore written to stay compatible with the previous application version.
- If the smoke tests fail, the new version is already live and the workflow is red. There is no automatic rollback; the fix is a new commit or a revert on `main`, which goes through CI and deployment again.
- Backend and frontend are two platforms, so the update is not atomic. For a short time, the new backend can serve the previous frontend.
- Deployments do not run in parallel. Intermediate commits may be skipped when several changes are merged quickly. The workflow validates the current `main` commit before deployment.
- **Cold start:** Render stops a free service after 15 minutes without traffic, so the first request after a pause can be slow.
