# Rules supported by this app

This guide describes the implemented game and its remaining house rules. The
publisher's [current English rulebook](https://cdnm.heyzine.com/files/uploaded/46b5bd7166a9f579404e175e4990c9d415b4aac7.pdf),
[live FAQ](https://www.grandpabecksgames.com/pages/skull-king), and
[Rascal scoring sheet](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Rascal_Scoring.pdf?v=1784153921)
are the rules sources, checked October 11, 2026.

## Choose the game

The creation screen offers separate switches for Mermaids, Kraken, White Whale,
Loot, and Pirate abilities, plus Classic or Rascal scoring. Settings stay fixed
for the match and appear in the lobby.

The default deck includes Mermaids, matching current standard setup. Simple deck
removes them. All base-game cards adds the creatures and Loot. These presets do
not enable Pirate abilities or change scoring.

## Play and score

Each player bids before play. Numbered cards follow the established suit when
possible; special cards can always be played. Black is trump. The first Pirate
beats later Pirates; a Mermaid beats numbered cards and captures the Skull King,
but loses to a Pirate unless the Skull King is also present. Tigress is declared
as Pirate or Escape when played. Leading with an Escape defers the suit;
leading with a character leaves it unrestricted.

Classic scoring awards 20 per correctly bid trick, or subtracts 10 per trick off.
A zero bid instead gains or loses 10 per card dealt. Capture bonuses require an
exact bid: numbered 14s award 10 (ordinary) or 20 (black); Pirate capturing Mermaid
awards 20, Skull King capturing Pirate 30, and Mermaid capturing Skull King 40.

Rascal scoring gives everyone the same potential: 10 per card dealt. Exact bids
earn all; off by one earns half; larger misses earn none. Ordinary capture
bonuses use the same fraction. Loot and Pirate wagers still require exact bids;
a missed wager loses its full stake.

## Optional cards and powers

Loot forms an alliance with its capturer; both exact bidders receive 20. Capturing
your own Loot creates no alliance. Kraken discards the trick. White Whale removes
special-card effects and compares numbers without suits. The later creature
controls resolution when both appear.

A winning Pirate can pause the result screen for its owner's choice. Rosie
chooses the next leader; Bendt draws two and discards two; Rascal wagers 10 or 20;
Juanita privately views undealt cards; Harry adjusts his bid by one or keeps it.
Only Harry is offered after the final trick. Other players wait while a choice
is pending. Completed or stale choices cannot be applied twice.

## Source conflict and remaining differences

The linked book and live FAQ disagree about White Whale played mid-trick. The
user selected the FAQ: an existing suit requirement remains. Kraken releases
that requirement under book page 19. A later White Whale does not restore it;
that transition is an explicit interpretation because restoration is unspecified.

The app currently has these limitations:

- Two-player games omit Graybeard and may include Loot. Official two-player play
  uses Graybeard and excludes Loot.
- Games stop after ten rounds even on a tie; official play adds tiebreak rounds.
- Capacity is six players. Eight-player dealing is not implemented.
- Opponents' bids are not yet displayed during play.
- Variable round schedules, Cannonball scoring, and newer expansion cards are
  not implemented.

See [AGENTS.md](AGENTS.md) for code boundaries and validation.
