# Skull King

## Repository and workflow

This is the canonical repository for the game engine, server, and web client.
Keep them in separate Yarn workspaces in this repository. The standalone
`trevor-scheer/skull-king-web` repository is retired after its client was imported.
Do not restart the migration or merge historical feature branches over this work.

Use isolated worktrees and `trevor/` branches for nontrivial changes. Preserve
unrelated work. Keep commits cohesive. Delegate independent substantial work and
review the result. User authorization in the active conversation governs commits,
pushes, and publishing. Do not assume this file authorizes future external actions.

## Architecture

| Workspace           | Main files                                                                                                              | Responsibility                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `skull-king-core`   | `game.ts`, `cards.ts`, `deck.ts`, `trickRules.ts`, `bonusPoints.ts`, `scoring.ts`, `pirateAbilities.ts`, `botPolicy.ts` | Authoritative rules and match transitions                       |
| `skull-king-server` | `index.ts`, `typeDefs.ts`, `resolvers.ts`, `rooms.ts`, `accounts.ts`                                                    | API validation, persistence, account identity, and live updates |
| `skull-king-web`    | `router.tsx`, `client.ts`, `hooks/`, `pages/`                                                                           | Presentation, room identity, accounts, and generated operations |

The core uses Node crypto and binary serialization; it is not a browser library.
Do not put authoritative rules in React or transport details in the engine.
Clients display `legalCardIds`; the engine still validates every action.

`Game` owns private tokens, cards, pending actions, presence, and autoplay state.
`getStateForPlayer` filters each viewer's state. Public queries must not disclose
hands, tokens, unrevealed bids, cannon loads, Juanita cards, or Mary's selected
card. `__debugDump` is test-only and must never become an API response. Bots choose
from their own filtered state; Graybeard has different official rules.

Game phases are `setup`, `play`, and `postgame`. Round phases are `bid`, `load`,
`play`, and `trick_result`. `load` exists only for Cannonball scoring.
`roundNumber` is the ordinal; `cardsPerPlayer` is the actual deal size. Use the
latter for bid limits, zero-bid scoring, final-trick checks, and powers.
`currentRound` is null outside play; `playerTurn` is null outside a playable turn.

The first human seat hosts. Starting, bot management, and absent-player takeover
require its token. Individual plays and choices require the owning token. Check
expected hand/ability/choice IDs to reject stale actions. Multi-stage powers
rotate their IDs. Pending Pirate or Plank choices must finish before advancement.
The server advances displayed trick results after five seconds; authenticated
clients may also request idempotent advancement.

Last Volley changes turn counts and skips the player's final trick. Mary can
force a card that ignores follow-suit. First Mate can queue captured Pirate
powers. Do not infer remaining turns from seat count or round ordinal. Preserve
trick metadata for captures, alliances, bonuses, and result explanations.

## Persistence and identity

Run one server process per data directory. Rooms are held in memory with private
binary checkpoints on disk. SQLite stores accounts, sessions, seat links, and
completed results. Save mutations before acknowledging them; failure recovery
must not leave memory ahead of disk. Preserve pending choices, shuffled deck
state, rematch links, and actual activity timestamps across restart. Expire idle
lobbies after 24 hours, games after seven days, and finished rooms after 30 days.
Reading a game is not match activity. Reset absence grace after restart.

SSE sends change notifications, never game state. Clients refetch authorized
queries, with ten-second fallback polling and bounded query batches. Mutations
are sent separately. Changes to server query limits must preserve valid generated
operations and shared-network multiplayer sessions.

A guest seat token is a bearer credential. Keep it out of URLs and logs. Browser
storage is keyed by room; changing rooms must not retain the old room's token.
Snapshots in Apollo must not mix private viewers or historical cards. Test partial
query merges and round transitions when changing cache policies.

Accounts are optional. Seat links require proof of the room token; display names
are not credentials. Passwords use salted scrypt, sessions and recovery codes are
hashed, account cookies are HttpOnly, and mutations require CSRF/origin checks.
Production account traffic requires HTTPS and explicit trusted-proxy settings.
Bound password work and request complexity. Do not include secrets in exports.
Completed results are recorded once. Any practice bot or delegated human marks
the entire match as practice permanently; exclude it from rankings. Graybeard
with two human players is eligible. Keep leaderboard points independent of raw
scores from different scoring modes.

## Rules and sources

Read [SKULL_KING_RULES.md](SKULL_KING_RULES.md),
[EXPANSION_RULES.md](EXPANSION_RULES.md), and
[round options](docs/round-options.md) before changing gameplay. Consult the
[publisher's rules and FAQ](https://www.grandpabecksgames.com/pages/skull-king)
and [expansion page](https://www.grandpabecksgames.com/pages/skull-king-expansion).
Source URLs and edition-sensitive decisions belong in those documents.

The standard deck has 70 cards with Mermaids. Simple has 68; all base cards has
74; the full expansion configuration has 93. Optional cards and Pirate powers
are separate settings. Capacity is eight seats, or nine when Wild 15 is enabled.
Graybeard joins two-player matches and removes Loot, Wild 15, 0/14, and Plank.
Normal schedules end with official extra rounds until one player leads; disabling
tiebreakers is an explicit shared-victory house option. Cannonball is an optional
published variant; do not claim its older source supersedes the standard sheet.

The user chose the live FAQ for the White Whale conflict: an established suit
requirement remains. Kraken releases it; a later White Whale does not restore it.
The latter is an explicit interpretation, not quoted publisher wording. Mermaid
capturing Skull King scores 40 in the selected edition. Rascal halves ordinary
capture bonuses when off by one; Loot and Pirate wagers still require exact bids.
Preserve tests for these decisions.

## Presentation

Follow [visual design](docs/visual-design.md) for UI changes. Keep the ink, ivory,
and brass palette, locally served fonts, scoped component styles, readable cards,
and visible keyboard focus. Verify desktop and phone layouts in the browser;
passing unit tests does not establish visual quality.

## Build and validate

Use Node 24 and Yarn 4.6.0 (`corepack yarn`). Keep the root lockfile. From the root:

```sh
corepack yarn install --immutable
corepack yarn codegen
corepack yarn test --runInBand
corepack yarn build
corepack yarn build:web
corepack yarn playwright install chromium
corepack yarn test:e2e
```

`codegen` reads the local schema. Edit the schema and operations, then regenerate
`skull-king-web/src/types/graphqlTypes.ts`; do not hand-edit generated types.
`check` runs Jest and both builds. Browser tests own temporary storage and a
random-port server; they do not use a developer's running game. CI checks generated
code, tests, builds, browser flows, and Docker startup.

For development, run `watch`, `dev`, and `dev:web` in separate terminals.
`dev` runs compiled server code; `watch` rebuilds it. Vite proxies `/graphql`,
`/events`, `/auth`, and `/api` to port 4000. See [DEPLOYMENT.md](DEPLOYMENT.md)
for configuration and backup procedures. Do not casually run `clean`; it removes
ignored build and dependency files.

Choose validation at the affected boundary: core rules, API privacy and auth,
persistence failures, Apollo cache, or browser interactions. Reproduce meaningful
behavioral bugs before fixing them. Avoid tests that only mirror implementation.
A full rules change needs interaction, scoring, and complete-match coverage.
Deployment readiness does not mean a public deployment exists.
