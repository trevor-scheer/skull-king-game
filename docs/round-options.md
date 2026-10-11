# Round and scoring options

Set `roundSchedule` when creating a game to choose the cards requested per
player in each round. The default is `[1,2,3,4,5,6,7,8,9,10]`. Custom schedules
accept 1–20 rounds with 1–10 cards per round. `ROUND_PRESETS` also provides the
named schedules in the [English rulebook, page 15](https://cdnm.heyzine.com/files/uploaded/46b5bd7166a9f579404e175e4990c9d415b4aac7.pdf).
Even Keeled uses five rounds in that edition; the older booklet used ten.

`Round.roundNumber` is the round's position. `Round.cardsPerPlayer` is the
actual hand size. Dealing caps the requested size at the number the deck can
supply equally to every seat, including Graybeard when present. Bid limits,
round completion, Pirate powers, and scoring use the actual size. The base
deck accepts eight human players; the expanded deck, identified by its Wild 15,
accepts nine. This follows the capacity approach on rulebook page 5.

`tieBreakers` defaults to `true`: when leaders tie after the scheduled rounds,
all players continue until one player leads. Extra rounds repeat the final
scheduled hand size, subject to capacity, and expose `isTieBreaker: true`.
The rulebook requires extra rounds on page 11 but does not prescribe their hand
size; repeating the last size is this app's explicit convention. Set
`tieBreakers: false` for a custom game that accepts shared winners.

## Cannonball

Set `scoringMode: rascal` and `cannonball: true` to enable the optional variant
in the publisher's [2021 booklet, page 20](https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf).
The separate Rascal scoring sheet omits this variant; the
[publisher's FAQ](https://www.grandpabecksgames.com/pages/skull-king) still
clarifies its wager rules. It remains optional and off by default.

After everyone bids, the round enters `load`. Bids are revealed, and each player
uses `loadCannon` to choose Grapeshot or Cannonball. Pass the player's token and
`expectedRoundNumber`; stale or duplicate choices return `false`. Each player
can see their own choice in `myCannonLoad`. Other choices remain hidden until
all players choose, then appear in `revealedCannonLoads` and play begins.

Grapeshot uses ordinary Rascal scoring. Cannonball awards 15 points per card
dealt for an exact bid and zero bid points otherwise. Capture and alliance
bonuses require an exact bid with Cannonball. A missed Pirate wager still loses
its full stake. Each player chooses again after bidding in the next round.
