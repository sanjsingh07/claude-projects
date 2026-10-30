# Multi-stage build for the AIFlipper backend.
#
# IMPORTANT: build with the repo root (flipper/) as the context, not this
# directory, because the backend depends on ../shared via `file:../shared`:
#
#   docker build -f AIFlipper-backend/Dockerfile -t aiflipper-backend .
#
# The shared package must be built (its dist/) for the backend to resolve it at
# runtime — a raw-TS package typechecks but fails at require(). This image builds
# shared first, then the backend, then ships only production deps + compiled JS.

# ---- deps + build ----
FROM node:22-slim AS build
WORKDIR /app

# Build the shared package first so its dist/ exists for the backend's install.
COPY shared/package*.json ./shared/
RUN cd shared && npm ci
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src
RUN cd shared && npm run build

# Backend deps. The file:../shared link resolves against the copied shared above.
COPY AIFlipper-backend/package*.json ./AIFlipper-backend/
RUN cd AIFlipper-backend && npm ci

# Backend source + compile to dist/.
COPY AIFlipper-backend/tsconfig.json ./AIFlipper-backend/
COPY AIFlipper-backend/src ./AIFlipper-backend/src
COPY AIFlipper-backend/database ./AIFlipper-backend/database
RUN cd AIFlipper-backend && npm run build

# ---- runtime ----
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Only production dependencies in the final image.
COPY shared/package*.json ./shared/
COPY --from=build /app/shared/dist ./shared/dist
COPY AIFlipper-backend/package*.json ./AIFlipper-backend/
RUN cd AIFlipper-backend && npm ci --omit=dev

COPY --from=build /app/AIFlipper-backend/dist ./AIFlipper-backend/dist
COPY AIFlipper-backend/database ./AIFlipper-backend/database

WORKDIR /app/AIFlipper-backend

# Run as the non-root user the base image ships.
USER node

EXPOSE 3000
# prestart would re-run tsc; call node directly on the already-compiled output.
CMD ["node", "dist/index.js"]
