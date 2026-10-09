# Build stage
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

# Runtime stage
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

COPY --chown=node:node migrations ./migrations
COPY --chown=node:node seed-data ./seed-data

USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
