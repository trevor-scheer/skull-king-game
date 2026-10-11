# Skull King game

## Scope and repository relationship

This repository contains the multiplayer game engine, GraphQL server, and React
client. Prefer it for work that spans gameplay and the player experience. Keep
these components as separate packages in one repository.

The separate `trevor-scheer/skull-king-web` repository has already been imported:
commit `8f5cff6` imported its older client, and `c4e52a7` imported the Vite/theme
revision. The `skull-king-web/` tree at `c4e52a7` exactly matches standalone commit
`a6cea38` (tree `8fd2c14a6a217a5599882868b397dcad903efb78`). A second source
migration is unnecessary for those revisions. Compare newer commits before
assuming the repositories still match. The standalone repository is retired;
its history remains available and new development belongs here.

The October 11, 2026 reliability pass builds on the repository cleanup at
`260f1b7`. It fixes match transitions, action validation, and the played-card
cache without merging the visual-polish branch. At the initial review, the
locally available refs also contained
separate work on shuffle fixes (`02d2e36`), test infrastructure (`f500b0c`), error
handling (`25ed6b6`), type safety (`eeced0c`), subscriptions (`e02f048`), and Docker
deployment (`704dba1`). These are sibling changes, not one integrated release.
Review their diffs and validation before reimplementing or integrating them.

## Architecture

The three Yarn workspaces have distinct responsibilities:

| Package | Responsibility | Entry points |
| --- | --- | --- |
| `@skull-king/core` | Cards, deck, turn/round transitions, legal moves, scoring | `skull-king-core/src/{cards,deck,game,scorecard}.ts` |
| `@skull-king/server` | GraphQL contract, game lookup, mutations, process lifetime | `skull-king-server/src/{index,typeDefs,resolvers}.ts` |
| `@skull-king/web` | React routes, Apollo state, room identity, board and controls | `skull-king-web/src/router.tsx`, `skull-king-web/src/client.ts`, and that workspace's `src/pages/` and `src/hooks/` |

The core has no external package dependencies, but `Game` uses Node's `crypto`;
do not assume the entire package is browser-compatible. Keep authoritative
gameplay rules in the core, transport logic in the server, and presentation in
the client. Client checks help players but do not replace server validation.

Optional rules are split into `trickRules.ts` (winner and creature resolution),
`bonusPoints.ts` (capture and Loot bonuses), `scoring.ts` (Classic/Rascal formulas),
and `pirateAbilities.ts` (authenticated Pirate choices). Keep those modules
independent of GraphQL and React.

Games live in a process-local `Map`. Finished games are removed after ten
minutes; unfinished games have no expiry. Restarting the server loses games.
The schema declares subscriptions, but this revision has no working subscription
transport or resolvers. The client uses HTTP polling, mostly every two seconds.

Game phases are `setup`, `play`, and `postgame`. A round progresses through
`bid`, `play`, and `trick_result`. Clients request `advanceTrick` after displaying
the result, supplying the completed hand's ID as `expectedHandId`. Duplicate or
stale requests return `false` without advancing. `currentRound` is null in the
lobby and postgame; `playerTurn` is null outside the round's play phase. Deploy
the schema and generated client together; older clients need a reload.
With pirate abilities enabled, a winning Pirate can pause `trick_result` for
its owner's choice. Resolve it with the pending ability ID and player token;
stale choices return false. Multi-step powers rotate that ID so retries cannot
draw twice. Juanita's undealt cards are visible only to the owner. Do not let
the result timer advance through a pending choice.
Tokens identify players within games; other players' hands are
removed from public state. Do not expose tokens, hands, or unrevealed bids in
public queries, logs, or future subscription broadcasts.

## Install, run, and validate

Use Yarn 4.6.0, pinned by the root `packageManager`, with the `node-modules`
linker. Run commands from the repository root. Do not introduce another lockfile.
Use `corepack yarn` if the global `yarn` command ignores the project version.
The cleanup adopts Apollo Server 5 and Node `>=22`; `.nvmrc` selects Node 24.
Apollo Server 5 itself requires Node `>=20`, but Node 20 is past end of life.
See the [Node release schedule](https://nodejs.org/en/about/previous-releases) and
[Apollo migration guide](https://www.apollographql.com/docs/apollo-server/migration).

Install dependencies and build the server packages:

```sh
yarn install --immutable
yarn build
```

Run the following in separate terminals:

```sh
yarn watch
yarn dev
yarn dev:web
```

`watch` rebuilds core/server TypeScript. `dev` runs the compiled server through
nodemon; it does not compile source. The server uses `PORT`, defaulting to 4000.
Vite runs the web app separately. `skull-king-web/src/client.ts` hardcodes
`http://localhost:4000/`; there is no implemented API URL environment setting at
this revision. Production hosting needs an appropriate API address and SPA
route fallback.

Use these checks according to the change:

| Command | Coverage |
| --- | --- |
| `yarn test --runInBand` | Core regressions, GraphQL match lifecycle, Apollo cache, and snapshots |
| `yarn build` | Core and server TypeScript projects |
| `yarn build:web` | Web TypeScript checks and Vite production bundle |
| `yarn codegen` | Regenerates web GraphQL types/hooks; requires the server at `localhost:4000` |

Edit the schema and `.graphql` operations, then regenerate
`skull-king-web/src/types/graphqlTypes.ts`; do not hand-edit generated types.
The web `lint` script is not a usable validation gate until ESLint and its
configuration are supplied. No CI workflow or automated browser suite exists
at this revision. Do not run `yarn clean` casually: it deletes ignored build and
dependency files.

On October 11, 2026, the options pass passed 190 Jest tests and 20 snapshots
(one test remained TODO) and both builds under Node 24.15.0 with Apollo 5.2.0.
API tests cover every deck combination, complete ten-round games with two and
six players under both scoring modes, and exercise private powers, stale
requests, and wager payouts. Browser smoke checks verified settings through
creation/lobby, Loot rendering, and Bendt drawing/discarding before play resumed.
The earlier reliability pass also verified retry after an advancement failure.
These are not a full multi-browser match test. Existing Sass warnings remain.

## Rules and change discipline

The current-standard default deck has 70 cards: 56 numbered cards, five Escapes,
five Pirates, one Tigress, one Skull King, and two Mermaids. Kraken, White Whale,
and Loot are opt-in via `DeckConfiguration`; enabling all gives 74 cards.
Mermaids default on even in a partial configuration; explicitly setting
`includeMermaids: false` selects the 68-card simple variant.
`pirateAbilities` defaults to false and `scoringMode` to `classic`; `rascal` is
the other supported mode. These are game-creation settings, shown in the lobby.
Joining is capped at six players despite a separate eight-player check in
`start()`. Standard play has ten rounds, with the round number determining
hand size. Treat deck composition, capacity, and scoring as explicit product
choices; do not silently change editions or house rules.

Consult the publisher's [rules and FAQ](https://www.grandpabecksgames.com/pages/skull-king)
and its linked rulebook before changing rules. Optional features need tests for
card interaction, turn order, scoring, API output, and client presentation.
In particular, the FAQ confirms that Mermaid wins a trick containing Mermaid,
Skull King, and Pirate; the second sea creature takes effect when Kraken and
White Whale both appear; and Loot bonuses require both partners to bid exactly.
Use the [current English rulebook](https://cdnm.heyzine.com/files/uploaded/46b5bd7166a9f579404e175e4990c9d415b4aac7.pdf)
for edition-sensitive behavior: Mermaid capturing Skull King awards 40, and
an all-special White Whale trick is discarded with the would-be winner leading
next. The FAQ clarifies that Kraken after White Whale determines the leader
without either creature. The current [Rascal scoring sheet](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Rascal_Scoring.pdf?v=1784153921)
awards half ordinary capture bonuses when off by one; Loot and Pirate wagers
still require exact bids. Pirate wagers lose their full stake on a missed bid.
The user explicitly selected the live FAQ over conflicting rulebook page 19:
White Whale preserves an established lead suit. Keep that regression and note
the conflict instead of claiming the undated FAQ is provably newer. Current
Kraken behavior follows page 19: it releases the suit requirement. A later
White Whale does not restore a requirement already released; this transition
avoids retroactively changing which earlier cards were legal. Current
remaining house-rule deviations are two-player play without Graybeard (Loot
allowed) and ending tied games after ten rounds. Official two-player play uses
Graybeard and excludes Loot; official tied games play extra rounds. The UI
discloses those limitations. Six-player capacity is an app limit, not a rulebook
limit.

`SKULL_KING_RULES.md` summarizes supported rules and explicit limitations;
`CLAUDE.md` delegates here. `IMPROVEMENTS.md` is historical brainstorming with
stale claims. Use publisher sources plus the source-precedence decision above
when changing rules. An unchecked roadmap item is not proof that code is absent.

Preserve unrelated local edits. Use isolated worktrees and `trevor/` branches for
nontrivial changes. Keep commits cohesive. For behavioral fixes, add meaningful
regressions at the failing boundary; snapshots alone do not validate GraphQL
nullability, authorization, or full-game progression.

## Known gaps and recommended order

The reliability pass fixed lobby/result/postgame nullability, duplicate trick
advancement, negative/fractional bids, late joins, blank names, card ownership
by exact ID, and invalid Tigress choices. Played-card snapshots are embedded in
Apollo's cache so summary queries do not require missing card fields.

1. **Exercise real multiplayer sessions.** API coverage now spans full games;
   add a complete browser scenario with multiple clients, disconnects, and
   simultaneous transitions. Keep the API and cache regressions intact.
2. **Define actor permissions.** `startGame` and `advanceTrick` still take no
   player/host credential. Decide who can start a room and own transitions,
   then enforce that policy in the authoritative path. An expected hand ID
   prevents stale advancement; it is not an authorization credential.
3. **Keep optional rules covered.** Mermaid captures, Loot alliances, creature
   interactions, Pirate powers, and Classic/Rascal scoring now have dedicated
   tests. Bonus scoring uses completed hands with winners and card owners;
   preserve that metadata when changing state storage. Played Tigress choices
   are snapshots, not mutations of shared deck cards. Loot uses a CSS card face
   and optional cards have explicit hand sort positions. Newer expansion cards,
   Graybeard, Cannonball, and configurable round schedules remain future work.
4. **Recover from routine failures.** `Hand.tsx` clears its click lock only on
   success; `BidForm.tsx` marks a bid submitted before its mutation succeeds.
   Reset pending state on failure and provide retry feedback. Fix room changes
   in `PlayerTokenContext.tsx` so a previous room's token is not retained.
   Add reconnect/resume behavior and define what happens when someone leaves.
5. **Make the table understandable.** Display bid versus tricks won, accurate
   opponent card counts, the lead suit, and why a card is illegal. Explain each
   trick winner and round score. Add a short interactive tutorial, room invite
   links, useful spectating (the component is a placeholder), and rematch.
   Validate touch controls, keyboard use, readable suit cues, and reduced motion
   on a real narrow-screen session.
6. **Keep game night running.** Add environment-based endpoints, durable game
   recovery, inactive-room expiry, and server-owned state transitions. Review
   the existing subscription and deployment branches before doing this work.
   Add CI for core tests, API contracts, web builds, and one full-game browser
   scenario. Avoid treating WebSockets alone as a solution to reconnection or
   persistence.
7. **Add replay value after reliability.** Practice bots, short-match presets,
   opt-in sound/haptics, match history, and richer optional rules are useful
   follow-ups. Prioritize fast joining and clear feedback before more cards or
   visual effects.
