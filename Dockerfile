# syntax=docker/dockerfile:1.4

# Stage 1: Base - Setup Node.js and Yarn
FROM node:22-alpine AS base
WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy package manager configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases

# Stage 2: Dependencies - Install all dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace package.json files
COPY skull-king-core/package.json ./skull-king-core/
COPY skull-king-server/package.json ./skull-king-server/
COPY skull-king-web/package.json ./skull-king-web/

# Install all dependencies (including devDependencies for build)
RUN --mount=type=cache,target=/root/.yarn \
    yarn install --immutable

# Stage 3: Builder - Build TypeScript and web app
FROM deps AS builder
WORKDIR /app

# Copy TypeScript configuration
COPY tsconfig.json tsconfig-base.json ./
COPY skull-king-core/tsconfig.json ./skull-king-core/
COPY skull-king-server/tsconfig.json ./skull-king-server/
COPY skull-king-web/tsconfig.json ./skull-king-web/
COPY skull-king-web/tsconfig.node.json ./skull-king-web/

# Copy source code
COPY skull-king-core/src ./skull-king-core/src
COPY skull-king-server/src ./skull-king-server/src
COPY skull-king-web/src ./skull-king-web/src
COPY skull-king-web/public ./skull-king-web/public
COPY skull-king-web/index.html ./skull-king-web/
COPY skull-king-web/vite.config.ts ./skull-king-web/

# Build TypeScript (core + server)
RUN yarn build

# Build web app (Vite)
RUN yarn build:web

# Stage 4: Production - Minimal runtime image
FROM node:22-alpine AS production
WORKDIR /app

# Install production dependencies only
ENV NODE_ENV=production

# Enable Corepack for Yarn 4
RUN corepack enable && corepack prepare yarn@4.6.0 --activate

# Copy package manager configuration
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases

# Copy workspace package.json files
COPY skull-king-core/package.json ./skull-king-core/
COPY skull-king-server/package.json ./skull-king-server/
COPY skull-king-web/package.json ./skull-king-web/

# Install production dependencies only (server + core)
RUN --mount=type=cache,target=/root/.yarn \
    yarn workspaces focus @skull-king/server --production

# Copy built artifacts from builder
COPY --from=builder /app/skull-king-core/dist ./skull-king-core/dist
COPY --from=builder /app/skull-king-server/dist ./skull-king-server/dist
COPY --from=builder /app/skull-king-web/dist ./skull-king-web/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/graphql?query={__typename}', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "skull-king-server/dist/index.js"]
