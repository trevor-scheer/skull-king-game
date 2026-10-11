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

See [AGENTS.md](AGENTS.md) for architecture, rules references, known bugs, and recommended priorities. Tests cover complete ten-round games through GraphQL with two and six players, invalid actions, and client cache regressions. Full multiplayer browser automation remains a follow-up. Game sessions are held in memory and disappear on server restart.

The API represents lobby/postgame rounds and inactive turns as nullable. Trick advancement requires the completed hand's `expectedHandId`, making duplicate and delayed requests safe. Release the server and regenerated web client together; existing browser tabs need a reload.

## Game settings

When creating a game, choose Mermaids, Kraken, White Whale, and Loot separately,
or start with a deck preset. Pirate abilities and Classic/Rascal scoring are
separate choices. Everyone can read the selected rules in the lobby; settings
stay fixed for the match. Defaults follow current standard setup: a 70-card deck
including Mermaids, Classic scoring, and pirate abilities off. The 68-card simple
deck remains available by switching Mermaids off.

All five base-game Pirate powers are supported. Winning players resolve their
choice before the next trick: choose a leader, place a wager, inspect undealt
cards privately, draw/discard two cards, or adjust their bid. Each choice can
be retried safely. Loot alliances award both partners only for exact bids,
including a zero bid; Rascal scoring does not relax that requirement.

Rules follow the publisher's [current English rulebook](https://cdnm.heyzine.com/files/uploaded/46b5bd7166a9f579404e175e4990c9d415b4aac7.pdf),
[FAQ](https://www.grandpabecksgames.com/pages/skull-king), and
[Rascal scoring sheet](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Rascal_Scoring.pdf?v=1784153921).
For the sea-creature follow-suit conflict between the linked book and the live
FAQ, this app follows the live FAQ: a White Whale does not release an already
established suit requirement. This is an explicit source-precedence decision;
the sources do not establish which wording was published later.
Kraken releases that requirement under rulebook page 19. A later White Whale
does not restore a requirement already released by Kraken.

Short-match schedules, Graybeard two-player play, Cannonball scoring, and the
newer expansion cards are not implemented. The app supports at most six players.
Two-player matches use a simplified house rule without Graybeard (and can include
Loot); the official two-player variant excludes Loot. Games currently end after
ten rounds even on a tie, rather than playing the official extra round.
