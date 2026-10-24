# Test runner image: Node.js, the dependencies of all three packages and the Playwright browsers.
# The build context is the repository root, because Playwright starts the frontend and the backend
# from their own folders.
FROM node:24-bookworm

WORKDIR /app

# Copy only the package files first, so a code change does not reinstall the dependencies.
COPY frontend/package.json frontend/package-lock.json frontend/
COPY backend/package.json backend/package-lock.json backend/
COPY automation/package.json automation/package-lock.json automation/

RUN npm ci --prefix frontend \
  && npm ci --prefix backend \
  && npm ci --prefix automation

# The browser versions come from the installed @playwright/test package,
# so the browsers always match package-lock.json.
ARG PLAYWRIGHT_BROWSERS="chromium firefox webkit"
RUN cd automation && npx playwright install --with-deps ${PLAYWRIGHT_BROWSERS}

COPY . .

WORKDIR /app/automation

ENTRYPOINT ["bash", "scripts/docker-test.sh"]
CMD ["all"]
