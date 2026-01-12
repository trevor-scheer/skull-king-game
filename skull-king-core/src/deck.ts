import { Card, basicDeck, buildDeck, DeckConfiguration } from "./cards";

export class Deck {
  // A complete deck of cards - useful for restoring from. Do not modify.
  private originalDeck: Card[];
  private cardMap: Map<string, Card>;
  // A deck of cards to be shuffled, drawn from, etc.
  private cardsInPlay: Card[] = [];
  private shuffleSeed: number | null;

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
    this.shuffle();
  }

  public shuffle() {
    const cloned = this.originalDeck.slice();
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor((this.shuffleSeed ?? Math.random()) * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    // Honestly probably not necessary
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor((this.shuffleSeed ?? Math.random()) * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    this.cardsInPlay = cloned;
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
}
