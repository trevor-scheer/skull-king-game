# Rules audit

On October 11, 2026, the deterministic matrix completed all 1,024 combinations of
the ten deck switches: 158,234 actions, 93 distinct cards, and 1,024 complete
scorecards. Seed `20261011` took about one second on the development machine.

Reproduce the audit from the repository root:

```sh
corepack yarn build
node scripts/rules-matrix.cjs
```

Pass an unsigned 32-bit seed to vary the deals while keeping a run reproducible:

```sh
node scripts/rules-matrix.cjs 42
```

Each configuration plays hands of 1, 3, 6, and 10 requested cards, capped by deck
capacity. Seat counts vary from two to nine as the deck permits. Scoring rotates
among Classic, ordinary Rascal, and Rascal with Cannonball. Powers are enabled;
one human seat delegates to autoplay and the remaining seats are practice
opponents. Two seats also exercise Graybeard. The runner rejects stalled choices,
missing rounds, wrong scorecard sizes, nonfinite scores, or incomplete card-ID
coverage. It seeds the deck explicitly and replaces Mary’s card-selection randomness
only within its own process, restoring it on exit. It does not run as part of the default Jest suite.

This is broad completion coverage, not exhaustive strategy or scoring proof.
Bots normally decline optional powers and choose Grapeshot; dedicated unit/API
tests cover wagers, Cannonball payouts, drawing/discarding, private views, and
stale requests. The matrix disables tiebreakers to give every case a bounded
length; separate round-options tests cover ties. It also does not replace browser
or concurrent-network testing.

The focused audit suite passed 69 tests and 14 snapshots across
`rules-audit.test.ts`, `optional-cards.test.ts`, `practice.test.ts`, and
`game.test.ts`. It added checks for Stingray's deferred lead, the established-suit
convention when Stingray appears later, and Davy Jones restoring normal hierarchy.
The apparent Stingray lead discrepancy was resolved by the publisher's
[expansion FAQ](https://www.grandpabecksgames.com/pages/skull-king-expansion), which
explicitly includes Stingray among deferred-suit leads. No rule implementation
change was needed. The old character-lead TODO was removed because existing
parameterized tests already verify unrestricted later numbered suits.

[The supported-rules guide](../SKULL_KING_RULES.md) records the source links,
source-precedence choice, and interpretations that remain explicit app conventions.
