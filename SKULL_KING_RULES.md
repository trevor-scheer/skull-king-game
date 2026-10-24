# Rules supported by this app

The app supports the standard game, Graybeard, both scoring systems, variable
round schedules, pirate powers, and the published expansion cards. Guest play
and optional accounts use the same game rules. Practice opponents and autoplay
are app features, described separately below.

## Sources and precedence

Rules were checked on October 11, 2026 against these publisher sources:

- [English base rulebook](https://cdnm.heyzine.com/files/uploaded/46b5bd7166a9f579404e175e4990c9d415b4aac7.pdf): standard play, bonuses, Graybeard, schedules, creatures, and powers.
- [Base-game FAQ](https://www.grandpabecksgames.com/pages/skull-king): card interactions, exact Loot/wager requirements, and suit following.
- [Expansion rulebook](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Expansion_Rulebook_Web.pdf?v=1753214318) and [expansion FAQ](https://www.grandpabecksgames.com/pages/skull-king-expansion): additional cards and lead-suit clarifications.
- [Hierarchy reference card](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/SK_Heirarchy.jpg?v=1672938216) and [bonus reference card](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/SK_Bonus_Points.jpg?v=1672938216): the in-game quick reference follows these two faces, checked October 24, 2026. It adapts the hierarchy, bonus eligibility, and optional cards to the current table; the published card awards 40 for Mermaid capturing Skull King.
- [Rascal scoring sheet](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Rascal_Scoring.pdf?v=1784153921): ordinary Rascal scoring. Cannonball uses the earlier booklet described in [round and scoring options](docs/round-options.md).

The user selected the live FAQ when it conflicts with the base rulebook about
White Whale. The FAQ is undated; this choice does not establish which text was
published later. Interpretations that the sources do not settle are listed below.

## Choose a voyage

The default 70-card deck includes Mermaids. Disabling Mermaids gives the simpler
68-card deck. Kraken, White Whale, and two Loot cards are separate options; all
base-game cards total 74. Expansion numbers and Mary add 14 cards, and the five
other expansion cards have individual switches. Enabling everything gives 93.
Powers are optional. Classic scoring and the standard ten-round schedule are
the defaults. Settings stay fixed once the match begins.

The app accepts up to eight player seats with the base deck, or nine with the
expansion numbers. If a requested hand size exceeds the available cards, everyone
receives the same smaller hand. Bidding limits and scoring use cards actually
dealt. Named schedules and custom schedules of 1–20 rounds, with 1–10 cards
requested per round, are supported. See [round options](docs/round-options.md).

After the scheduled rounds, tied leaders trigger extra rounds by default.
Everyone continues until one player leads. Extra rounds repeat the last hand
size; that size is an app convention. Turning tiebreakers off permits shared wins.

## Play a round

Bid how many tricks you expect to win. Bids stay private until everyone submits.
A numbered lead establishes the suit: follow it with a numbered card if you can,
or play a special card. Black is trump. Without trump or a winning special card,
the highest card of the established suit wins. Equal ranks resolve in play order.

Escapes defer the lead suit. Loot and Tigress declared as Escape do the same.
A character lead leaves later numbered suits unrestricted for the whole trick.
Declare Tigress as Pirate or Escape when playing it.

Pirates beat numbered cards and Mermaids; the first Pirate beats later Pirates.
Skull King beats Pirates. Mermaid beats Skull King, including a trick containing
both Skull King and a Pirate. With only Escapes, the first Escape wins.
The winner leads the next trick, subject to creature resolution and pirate powers.

## Two-player games

With two player seats, deal a third hand to Graybeard. The two players alternate
round leaders. After a human leads a trick, Graybeard reveals its next card second,
without following suit. If Graybeard wins, it leads next and the original round
leader plays second. Its Tigress is Escape. It neither bids nor receives scores.

Loot, Wild 15, Walk the Plank, and 0/14 cards are removed for the entire match.
The same structure applies to a practice game with one human and one practice
opponent. The internal `twoPlayerMode: duel` option exists for scripted fixtures;
the player-facing game uses Graybeard.

## Scoring

| Mode or bid | Exact bid | Missed bid |
| --- | --- | --- |
| Classic, positive bid | 20 per trick won | Lose 10 per trick away from the bid |
| Classic, zero bid | Gain 10 per card dealt | Lose 10 per card dealt |
| Rascal, Grapeshot | Gain 10 per card dealt | Half when off by one; zero when off by more |
| Rascal, Cannonball | Gain 15 per card dealt | Zero |

Cannonball is optional under Rascal. After bids are revealed, each player chooses
Grapeshot or Cannonball privately; play begins when everyone chooses.

Ordinary capture bonuses are 10 for each ordinary-suit printed 14, 20 for black
14, 20 per Mermaid captured by a Pirate, 30 per Pirate captured by Skull King,
and 40 for Mermaid capturing Skull King. Tigress counts as Pirate only when
played that way. Only the actual capturer receives capture bonuses.

Classic and Cannonball require an exact bid for bonuses. Ordinary Rascal awards
half ordinary capture bonuses when off by one. Loot, expansion bonuses and
penalties, and pirate wagers still require exact bids. A missed wager loses its
full stake under either scoring system.

## Creatures, Loot, and powers

Kraken discards the trick; the player who would have won leads next. White Whale
compares numbers without suits and neutralizes character effects. With no numbers,
the trick is discarded and its would-be winner leads. The last creature played
controls resolution when multiple creatures appear, unless Davy Jones removes
them. Numbered-card bonuses remain available in a won creature trick.

Loot allies its owner with the trick winner. Both must bid exactly for each to
receive 20. Winning your own Loot creates no alliance. Discarded tricks and
White Whale/Stingray tricks create no Loot alliance.

When powers are enabled, winning with a named Pirate pauses play for its choice:

- Rosie chooses the next leader, including herself or Graybeard.
- Bendt draws two undealt cards, then discards two. A card forced by Mary cannot be discarded. Drawing requires two cards remaining in the deck; declining is available before drawing.
- Rascal may wager 10 or 20 on an exact bid, or decline.
- Juanita privately views the undealt cards, then finishes her choice.
- Harry adjusts the bid by one or leaves it unchanged, within the hand's limits.

Only Harry acts after the final trick. Graybeard receives no power choices; this
is the app's automatic-player convention. An ordinary practice opponent can
resolve powers, and an absent human's pending choice can be completed by autoplay.

## Expansion cards

| Card | Implemented effect |
| --- | --- |
| Extra 7s and 8s | Capture gives −5 or +5 respectively on an exact bid. |
| 0/14 | Declare its value when played; no 14 capture bonus. |
| Wild 15 | Follows yellow, green, or purple; choose one without a lead. Never trump. |
| Mary Thorne | Pirate rank. With powers enabled, her winner must force a random unseen card from a chosen hand into the next trick. |
| First Mate Con | Beats Pirates, loses to Mermaid/Skull King. Offers captured Pirate powers. Those two capturers earn 30 for him; he earns no Pirate-capture bonus. |
| Walk the Plank | Remove one ordinary Pirate, choosing if several exist. Removed Pirates give no capture bonus. |
| Spotted Stingray | Lowest number wins, with first-played ties. |
| Last Volley | Play another card after everyone else, then skip the final trick. No extra play on the final trick. |
| Davy Jones | Removes all creatures regardless of order; its owner earns 20 per creature on an exact bid. |

The expansion FAQ confirms Mermaid wins a Pirate–Mermaid–First Mate trick.
It also says Stingray, Davy Jones, Walk the Plank, and Last Volley defer a lead
suit. Those four do not beat an Escape. With only nonwinning specials and no
ranking card, discard the trick and retain the original leader.

## Interpretations and app boundaries

- **White Whale and Stingray suit requirements:** White Whale retains an established suit under the selected base FAQ, despite base rulebook page 19 saying otherwise. Stingray also retains it: an interpretation of the expansion's White Whale comparison, since its FAQ addresses only leading. Stingray leading defers suit under the explicit expansion FAQ; White Whale leading leaves the suit unrestricted.
- **Kraken:** Base rulebook page 19 releases the existing suit requirement. A later White Whale or Stingray does not restore it. Restoration is unspecified, so the app does not change that requirement again mid-trick.
- **Creature capture bonuses:** Suits do not affect the creature's number comparison, but printed 14 bonuses retain their original values. White Whale and Stingray suppress character and Loot bonuses. This distinguishes winning rank from printed bonuses where the publisher does not detail every interaction.
- **Walk the Plank:** “Standard Pirate” includes Mary, who has normal Pirate rank, but excludes Tigress and First Mate. This follows the booklet's wording rather than treating every Pirate-like character as removable.
- **First Mate powers:** Captured powers are offered in card-play order. Each is optional, including captured Mary. The order is an app convention; the sources do not specify a selection order.
- **Capacity:** The app caps seats at eight or nine; the expansion booklet also describes larger physical groups, which this app does not accept.

## Practice and leaving a game

The host can add or remove practice opponents in the lobby. Leaving the lobby
removes your seat and transfers hosting to the first remaining human. During
play, you can enable autoplay or leave with autoplay and later reclaim your seat.
The host can enable it for someone else after 90 seconds without an authenticated
state request; a fresh request invalidates an older absence observation.

Bots choose from their own hand, legal moves, and public information. They use a
simple bidding/play strategy, Grapeshot, and usually decline optional powers;
they finish mandatory or already-started choices. They are practice opponents,
not expert players. Adding a bot or enabling autoplay permanently marks that
match as practice, excluding it from the casual leaderboard. Graybeard alone
does not. A rematch retains practice opponents but resets human autoplay.

See [AGENTS.md](AGENTS.md) for code boundaries and validation.
