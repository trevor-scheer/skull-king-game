import { buildDeck } from "../src/cards";
import { Deck, DeckOptions } from "../src/deck";

// Preserve the explicit deal orders behind historical gameplay snapshots.
// New fixtures should specify customDeck + noShuffle instead of these old seeds.
export class LegacyDeal extends Deck {
  constructor(options: DeckOptions = {}) {
    if (options.shuffleSeed == null) { super(options); return; }
    const cards = [...(options.customDeck ?? buildDeck(options.deckConfig))];
    for (let pass = 0; pass < 2; pass++) {
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(options.shuffleSeed * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
    }
    super({ customDeck: cards.reverse(), noShuffle: true });
  }
}
