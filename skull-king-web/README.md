# Skull King web client

The React/Vite frontend for the Skull King game monorepo. Use this workspace for frontend development; the former standalone repository is retired.

Follow the [root setup instructions](../README.md). From the monorepo root:

```sh
corepack yarn dev:web
corepack yarn build:web
corepack yarn codegen
```

The development server is separate from the GraphQL API. `src/client.ts` and `codegen.yml` target `http://localhost:4000/`. Code generation requires the API to be running.

Edit colocated `.graphql` operations and regenerate `src/types/graphqlTypes.ts`. Keep authoritative game rules in `@skull-king/core` and server validation in `@skull-king/server`.

See [AGENTS.md](../AGENTS.md) for the source map, validation guidance, and known limitations.
