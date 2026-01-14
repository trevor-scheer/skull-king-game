import { Card, basicDeck, buildDeck, DeckConfiguration } from "./cards";

export class Deck {
  // A complete deck of cards - useful for restoring from. Do not modify.
  private originalDeck: Card[];
  private cardMap: Map<string, Card>;
  // A deck of cards to be shuffled, drawn from, etc.
  private cardsInPlay: Card[] = [];
  private shuffleSeed: number | null;
  private noShuffle: boolean;

  constructor(options?: DeckOptions) {
    // Priority: customDeck > deckConfig > basicDeck
    if (options?.customDeck) {
      this.originalDeck = options.customDeck;
    } else if (options?.deckConfig) {
      this.originalDeck = buildDeck(options.deckConfig);
    } else {
      this.originalDeck = basicDeck;
    }

    this.cardMap = new Map(
      Object.entries(
        this.originalDeck.reduce((acc, card) => {
          acc[card.id] = card;
          return acc;
        }, {} as { [key: string]: Card })
      )
    );

    this.shuffleSeed = options?.shuffleSeed ?? null;
    this.noShuffle = options?.noShuffle ?? false;
    this.shuffle();
  }

  public shuffle() {
    const cloned = this.originalDeck.slice();

    if (this.noShuffle) {
      // For testing: reverse so draw() returns cards in original order
      // (draw pops from end, so reverse makes first card in deck = first drawn)
      this.cardsInPlay = cloned.reverse();
      return;
    }

    // Use seeded PRNG if seed provided, otherwise use Math.random
    const random = this.shuffleSeed !== null
      ? this.createSeededRandom(this.shuffleSeed)
      : Math.random;

    // Fisher-Yates shuffle
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    this.cardsInPlay = cloned;
  }

  // Simple seeded PRNG (mulberry32)
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  public draw() {
    const card = this.cardsInPlay.pop();
    if (!card) {
      throw new Error("Tried to draw from an empty deck");
    }
    return card;
  }

  public getCard(id: string) {
    return this.cardMap.get(id);
  }

  public __debugDeck() {
    return {
      originalDeck: this.originalDeck,
      cardsInPlay: this.cardsInPlay,
    };
  }
}

interface DeckOptions {
  shuffleSeed?: number;
  customDeck?: Card[];
  deckConfig?: DeckConfiguration;
  noShuffle?: boolean;
}
