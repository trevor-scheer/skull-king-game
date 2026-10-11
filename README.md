# Skull King

The canonical repository for the Skull King multiplayer game: a TypeScript rules engine, GraphQL server, and React web client in one Yarn workspace.

The former [standalone web repository](https://github.com/trevor-scheer/skull-king-web) is retired. Its complete client source was imported here; develop the frontend in `skull-king-web/`.

## Run locally

Use Node 24 (selected by `.nvmrc`), or another supported Node release satisfying `>=22`, and the pinned Yarn 4.6.0 through Corepack.

Install and build the server packages:

```sh
corepack yarn install --immutable
corepack yarn build
```

Run each command in its own terminal:

```sh
corepack yarn watch
corepack yarn dev
corepack yarn dev:web
```

The API listens on port 4000 by default; `PORT` overrides it. Open the URL printed by Vite for the web client. The client currently targets `http://localhost:4000/`, so changing the server port also requires updating `skull-king-web/src/client.ts` and the codegen endpoint.

## Packages

| Directory | Purpose |
| --- | --- |
| `skull-king-core/` | Deck, legal moves, rounds, trick resolution, and scoring |
| `skull-king-server/` | Apollo Server API and in-memory game sessions |
| `skull-king-web/` | React/Vite client and generated GraphQL hooks |

## Validate changes

```sh
corepack yarn test --runInBand
corepack yarn build
corepack yarn build:web
```

After changing the schema or client GraphQL operations, run `corepack yarn codegen` with the server running.

See [AGENTS.md](AGENTS.md) for architecture, rules references, known bugs, and recommended priorities. The core tests and builds do not yet cover a complete multiplayer match. Game sessions are held in memory and disappear on server restart.
