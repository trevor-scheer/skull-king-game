# syntax=docker/dockerfile:1
FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
COPY skull-king-core/package.json ./skull-king-core/package.json
COPY skull-king-server/package.json ./skull-king-server/package.json
COPY skull-king-web/package.json ./skull-king-web/package.json
RUN yarn install --immutable
COPY . .
RUN yarn build && yarn build:web
RUN yarn workspaces focus @skull-king/server --production && yarn cache clean

FROM node:24.22.1-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=4000 DATA_DIR=/app/data
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/skull-king-core/package.json ./skull-king-core/package.json
COPY --from=build --chown=node:node /app/skull-king-core/dist ./skull-king-core/dist
COPY --from=build --chown=node:node /app/skull-king-server/package.json ./skull-king-server/package.json
COPY --from=build --chown=node:node /app/skull-king-server/dist ./skull-king-server/dist
COPY --from=build --chown=node:node /app/skull-king-web/dist ./skull-king-web/dist
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "skull-king-server/dist/index.js"]
