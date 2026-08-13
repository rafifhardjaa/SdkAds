# syntax=docker/dockerfile:1

# ---- Stage 1: Build ----
FROM node:22-slim AS build
WORKDIR /app

# Build tools for native modules (better-sqlite3 compiles from source)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/sdk/package.json packages/sdk/package.json

RUN npm ci

# Copy source
COPY packages/backend packages/backend
COPY packages/sdk packages/sdk

# Build backend (tsup bundles TS -> CJS dist + copies public/)
RUN npm run build:backend

# ---- Stage 2: Runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/telemetry.db

# Backend dist artifacts
COPY --from=build /app/packages/backend/dist ./dist

# Node_modules from build stage (better-sqlite3 native module matches
# node:22-slim ABI since both stages use the same base image)
COPY --from=build /app/node_modules ./node_modules

# Persisted SQLite data directory
RUN mkdir -p /app/data

EXPOSE 3000

# Volumes for persistent telemetry DB (SQLite)
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))" || exit 1

CMD ["node", "dist/index.js"]