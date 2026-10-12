# Skull King

A multiplayer Skull King game with a TypeScript rules engine, GraphQL server,
and React client in one Yarn workspace. The former standalone web repository is
retired; frontend development belongs in `skull-king-web/`.

## Play

Create a room, share its invite link, and join with a name. Accounts are optional.
The first human player hosts the lobby. Add practice pirates to play on your own,
or invite friends and let spectators watch the public table.

The game supports the standard deck, optional creatures and Loot, all five Pirate
powers, Graybeard for two players, and the publisher's expansion. Choose cards
individually or use a preset. Classic and Rascal scoring, optional Cannonball
loads, seven round schedules, custom schedules, and tiebreak rounds are available.
Capacity is eight seats, or nine with Wild 15; Graybeard is an extra automated seat
for two-player games. Large tables use the number of cards the deck can deal equally.

The table shows legal plays, bids, trick counts, suit requirements, trick results,
and score breakdowns. Learn the basics through five interactive lessons. The
interface supports keyboard and touch input, reduced motion, and optional sound
and vibration. Rematches retain the crew and selected rules.

Seats survive reloads and server restarts. Use a private recovery code or link a
seat to an optional account to resume on another device. Accounts include recovery
codes, match history, data export, deletion, and a casual leaderboard. Practice
matches and matches using autoplay do not count toward that leaderboard.

## Run locally

Use Node 24 and the pinned Yarn 4.6.0 through Corepack. Install and build:

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

Open the Vite URL. Its development proxy sends API, account, and live-update
requests to port 4000. Production uses one origin for the built app and server.
See [deployment instructions](DEPLOYMENT.md) for Docker, HTTPS, persistent storage,
backups, and environment settings.

## Develop

| Package | Responsibility |
| --- | --- |
| `skull-king-core/` | Authoritative cards, legal moves, scoring, powers, bots, and match state |
| `skull-king-server/` | GraphQL, account API, durable rooms, SQLite history, and live updates |
| `skull-king-web/` | React interface, room identity, accounts, and generated GraphQL hooks |

Run the checks from the repository root:

```sh
corepack yarn codegen
corepack yarn check
corepack yarn playwright install chromium
corepack yarn test:e2e
```

Code generation reads the local schema; no server is needed. Tests include
complete matches, private-state boundaries, retry and cache regressions,
persistence failures, and multiple browser sessions across a server restart.
GitHub Actions also builds and starts the deployment image.

Read [AGENTS.md](AGENTS.md) for architectural contracts and
[implemented rules](SKULL_KING_RULES.md) for publisher sources and explicit
interpretations. The White Whale follow-suit conflict follows the live FAQ by
project decision; an undated FAQ is not evidence of a newer edition.
