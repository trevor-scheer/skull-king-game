import { randomInt } from "node:crypto";
import { Card, basicDeck, buildDeck, DeckConfiguration } from "./cards";

export class Deck {
  // A complete deck of cards - useful for restoring from. Do not modify.
  private originalDeck: Card[];
  private cardMap: Map<string, Card>;
  // A deck of cards to be shuffled, drawn from, etc.
  private cardsInPlay: Card[] = [];
  private shuffleSeed: number | null;
  private randomState: number;
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
    if (this.shuffleSeed !== null && !Number.isFinite(this.shuffleSeed)) throw new Error("Shuffle seed must be finite");
    this.randomState = 2166136261;
    for (const character of String(this.shuffleSeed)) {
      this.randomState = Math.imul(this.randomState ^ character.charCodeAt(0), 16777619) >>> 0;
    }
    this.noShuffle = options?.noShuffle ?? false;
    this.shuffle();
  }

  public shuffle() {
    const cloned = this.originalDeck.slice();
    if (this.noShuffle) {
      this.cardsInPlay = cloned.reverse();
      return;
    }
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = this.shuffleSeed === null ? randomInt(i + 1) : Math.floor(this.seededRandom() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    this.cardsInPlay = cloned;
  }

  private seededRandom() {
    // A serializable Mulberry32 state continues across rounds and checkpoints.
    this.randomState = (this.randomState + 0x6d2b79f5) >>> 0;
    let value = Math.imul(this.randomState ^ (this.randomState >>> 15), this.randomState | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  public draw() {
    const card = this.cardsInPlay.pop();
    if (!card) {
      throw new Error("Tried to draw from an empty deck");
    }
    return card;
  }

  public drawMany(count: number) {
    if (!Number.isInteger(count) || count < 0 || count > this.cardsInPlay.length) {
      throw new Error("Not enough undealt cards to draw");
    }
    return Array.from({ length: count }, () => this.draw());
  }

  public getUndealtCards(): Card[] {
    return this.cardsInPlay.map((card) => ({ ...card }));
  }

  public get size() {
    return this.originalDeck.length;
  }

  public getCard(id: string) {
    return this.cardMap.get(id);
  }

  public retainCards(keep: (card: Card) => boolean) {
    this.originalDeck = this.originalDeck.filter(keep);
    this.cardsInPlay = this.cardsInPlay.filter(keep);
    this.cardMap = new Map(this.originalDeck.map((card) => [card.id, card]));
  }

  public __debugDeck() {
    return {
      originalDeck: this.originalDeck,
      cardsInPlay: this.cardsInPlay,
    };
  }
}

export interface DeckOptions {
  noShuffle?: boolean;
  shuffleSeed?: number;
  customDeck?: Card[];
  deckConfig?: DeckConfiguration;
}
