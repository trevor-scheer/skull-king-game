# Expansion rules and implementation

This game supports the 19-card Skull King expansion as a configurable addition
to the standard deck. Enable `includeExpansion` for the 14-card group: the extra
7, 8, and 0/14 in each suit, Wild Monkey 15, and Mary Thorne. First Mate Con,
Spotted Stingray, Davy Jones’ Locker, Walk the Plank, and Last Volley each have
separate deck flags. With every base and expansion option enabled, the deck has
93 cards.

The source is the publisher’s [expansion rulebook](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Expansion_Rulebook_Web.pdf?v=1753214318),
checked against its [reference cards](https://cdn.shopify.com/s/files/1/0565/3230/4053/files/SKEP_Rule_cards_web.pdf?v=1760970363)
and [expansion FAQ](https://www.grandpabecksgames.com/pages/skull-king-expansion)
on October 11, 2026. Retain the user’s base-game source precedence: the live FAQ
preserves an established lead suit under White Whale.

## Card behavior

- Extra 7s and 8s have ordinary suit and rank. Ties go to the first played card.
  Capturing an expansion 7 subtracts five points; an expansion 8 adds five.
  These adjustments require an exact bid, including under Rascal scoring
  (rulebook pages 4 and 10).
- A 0/14 declaration is required when the card is played. Neither declaration
  earns a 14 capture bonus. The deck’s original card remains unchanged (page 5).
- Wild Monkey 15 follows a yellow, green, or purple lead. When leading, its
  player chooses one of those suits. It cannot become black or evade a held
  black suit. White Whale treats it as the highest number (pages 5–6).
- Mary is a Pirate. With abilities enabled, her winner chooses a player and the
  server selects an unseen random card from that player’s remaining hand. Only
  that player sees the selected card ID. They must play it next trick regardless
  of suit; Bendt cannot discard it. Mary’s own power is mandatory when enabled.
  First Mate may decline a captured Mary power (pages 6–7).
- First Mate defeats Pirates and loses to Mermaids and Skull King. His winner
  may use each captured Pirate’s power; the dialog resolves them in played
  order. He earns no Pirate capture bonuses. Mermaid or Skull King capturing
  him earns 30 points with an exact bid (page 7).
- Walk the Plank removes one standard Pirate after all plays, before resolving
  the winner. A single available target is removed automatically. Multiple
  targets require an authenticated choice from the player of Walk the Plank.
  Mary counts as a standard Pirate; Tigress and First Mate do not. Removed cards
  remain visible in the trick record but cannot win or grant capture bonuses
  (pages 7–8).
- Stingray makes the lowest numbered card win, with the first played breaking
  ties. The last sea monster determines the effect. With only Escapes and
  nonwinning expansion cards, the first Escape wins (pages 8 and 10).
- Last Volley adds a play after all regular turns. Its player skips the round’s
  final trick. If played in that final trick, it adds no play. Turn sequencing
  includes the extra play before resolving powers or Walk the Plank (pages 8–9).
- Davy Jones removes all sea monsters and itself when the trick resolves.
  Remaining cards compete normally in played order. Its player earns 20 points
  per removed monster if their bid is exact, even when somebody else wins the
  trick (pages 9–10). Earlier legal plays are not retroactively invalidated.
- A trick containing only nonwinning cards is discarded and its original
  leader leads again. Leading Stingray, Davy Jones, Last Volley, or Walk the
  Plank defers the lead suit (pages 10–11 and FAQ).

Official two-player play excludes Wild Monkey 15, Walk the Plank, and every
0/14 card (page 11), in addition to the base-game exclusion of Loot. Those
exclusions belong in the Graybeard deck setup, before dealing or shuffling.

## State and validation

`expansion.ts` owns declarations, Plank choice preparation, and Last Volley turn
order. `trickRules.ts` resolves winners, while `bonusPoints.ts` separates
expansion adjustments from ordinary capture bonuses so Rascal does not award
half of them after a missed bid. `pirateAbilities.ts` owns Mary and First Mate’s
queued powers.

Plank mutations require the pending choice ID, player token, and an available
Pirate ID. Duplicate or stale choices return false. Mary uses the existing
ability ID contract. `Round.myForcedCardId` is viewer-specific; do not expose
`Round.forcedCards` through the public schema. Played number/suit declarations
are snapshots and must not mutate the deck’s original card.

Core tests cover rank ties, monster ordering, Davy Jones removal, exact-bid
bonuses, declarations, forced cards, additional turns, and stale choices. API
tests cover Mary’s privacy and complete ten-round games with all expansion
cards at three and six players. The integrated Graybeard and round-schedule
features must also use actual `cardsPerPlayer` for final-trick decisions.
