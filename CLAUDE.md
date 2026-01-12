# Skull King Game

A multiplayer card game implementation with a TypeScript monorepo architecture.

## Project Structure

```
skull-king-monorepo/
├── skull-king-core/     # @skull-king/core - Game logic library (no deps)
├── skull-king-server/   # @skull-king/server - GraphQL API server
└── skull-king-web/      # @skull-king/web - React frontend (Vite)
```

## Tech Stack

- **Package Manager**: Yarn 4.x with workspaces
- **Language**: TypeScript 5.x (ES2022 target for server, ES2020 for web)
- **Server**: Apollo Server 4.x with GraphQL
- **Web**: React 18 + Vite + Sass + Apollo Client
- **Testing**: Jest with ts-jest

## Commands

```bash
# Install dependencies
yarn install

# Build TypeScript (core + server)
yarn build

# Build web app
yarn build:web

# Run server (requires build first)
yarn dev

# Run web dev server
yarn dev:web

# Run tests
yarn test

# Generate GraphQL types for web
yarn codegen
```

## Package Details

### @skull-king/core
Pure TypeScript game logic with no external dependencies. Exports:
- `Game` class - Main game orchestrator
- `Deck` class - Card shuffling and drawing
- `Scorecard` class - Scoring calculations
- Card types and utilities

### @skull-king/server
GraphQL API using Apollo Server. Key files:
- `src/index.ts` - Server setup
- `src/typeDefs.ts` - GraphQL schema
- `src/resolvers.ts` - Query/mutation resolvers

Games are stored in-memory and cleaned up 10 minutes after ending.

### @skull-king/web
React SPA with pirate theme styling. Key directories:
- `src/pages/` - Route components (Home, Game, PostGame)
- `src/hooks/` - Custom hooks (useLocalStorage, useGameId)
- `src/styles/` - Sass variables, mixins, animations
- `src/types/graphqlTypes.ts` - Generated types (run `yarn codegen`)

## Game Rules Overview

Skull King is a trick-taking card game for 2-6 players:
- 10 rounds total (round N deals N cards)
- Players bid on tricks they'll win
- Card hierarchy: Skull King > Pirates > Black (trump) > Colored suits
- Special cards: Escape (loses), Tigress (pirate or escape), Skull King (beats pirates)
- Scoring: +20 per correct trick, bonuses for capturing pirates with Skull King

## Development Notes

- The server must be built before running (`yarn build && yarn dev`)
- Web codegen requires server running on localhost:4000
- Use `workspace:*` protocol for internal package dependencies
- Tests are in `skull-king-core/src/__tests__/`

## GraphQL API

Key operations:
- `newGame` - Create game, returns gameId
- `addPlayer(gameId, name)` - Join game, returns playerToken
- `startGame(gameId)` - Begin game
- `submitBid(gameId, playerToken, count)` - Place bid
- `playColoredCard/playSpecialCard` - Play cards
- `state(gameId, playerToken)` - Query/subscribe to game state
