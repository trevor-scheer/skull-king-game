export type Card = ColoredCard | SpecialCard;

export type Color = "YELLOW" | "GREEN" | "PURPLE" | "BLACK";
export interface ColoredCard {
  id: string;
  color: Color;
  number: number;
  expansion?: boolean;
  choice?: boolean;
  wild?: boolean;
}

export function isColoredCard(card: Card): card is ColoredCard {
  return "color" in card && "number" in card;
}

export type SpecialCardTypes =
  | "escape"
  | "pirate"
  | "tigress"
  | "skullKing"
  | "mermaid"
  | "kraken"
  | "whiteWhale"
  | "loot"
  | "maryThorne"
  | "firstMate"
  | "stingray"
  | "davyJones"
  | "walkThePlank"
  | "lastVolley";

export interface SpecialCard {
  id: string;
  type: SpecialCardTypes;
  selection?: null | "pirate" | "escape";
}

export function isSpecialCard(card: Card): card is SpecialCard {
  return "type" in card;
}

export const colors: Color[] = ["YELLOW", "GREEN", "PURPLE", "BLACK"];

const coloredCards: ColoredCard[] = colors
  .map((color) =>
    Array.from(Array(14)).map((_, index) => ({
      id: `${color.toLocaleLowerCase()}-${index + 1}`,
      color,
      number: index + 1,
    })),
  )
  .flat();

const escapes: SpecialCard[] = Array.from(Array(5)).map((_, index) => ({
  id: `escape-${index + 1}`,
  type: "escape",
}));

const pirates: SpecialCard[] = Array.from(Array(5)).map((_, index) => ({
  id: `pirate-${index + 1}`,
  type: "pirate",
}));

// Optional expansion cards
const mermaids: SpecialCard[] = Array.from(Array(2)).map((_, index) => ({
  id: `mermaid-${index + 1}`,
  type: "mermaid",
}));

const lootCards: SpecialCard[] = Array.from(Array(2)).map((_, index) => ({
  id: `loot-${index + 1}`,
  type: "loot",
}));

const kraken: SpecialCard = { id: "kraken", type: "kraken" };
const whiteWhale: SpecialCard = { id: "whiteWhale", type: "whiteWhale" };

// Configuration for which optional cards to include
export interface DeckConfiguration {
  includeMermaids?: boolean;
  includeKraken?: boolean;
  includeWhiteWhale?: boolean;
  includeLoot?: boolean;
  includeExpansion?: boolean;
  includeFirstMate?: boolean;
  includeStingray?: boolean;
  includeDavyJones?: boolean;
  includeWalkThePlank?: boolean;
  includeLastVolley?: boolean;
}

// Build a deck based on configuration
export function buildDeck(config: DeckConfiguration = {}): Card[] {
  const deck: Card[] = [
    ...coloredCards.slice(),
    ...escapes.slice(),
    ...pirates.slice(),
    { id: `tigress`, type: "tigress" },
    { id: `skullKing`, type: "skullKing" },
  ];

  if (config.includeMermaids ?? true) {
    deck.push(...mermaids.slice());
  }
  if (config.includeKraken) {
    deck.push(kraken);
  }
  if (config.includeWhiteWhale) {
    deck.push(whiteWhale);
  }
  if (config.includeLoot) {
    deck.push(...lootCards.slice());
  }

  if (config.includeExpansion) {
    for (const color of colors) {
      for (const number of [7, 8])
        deck.push({
          id: `${color.toLowerCase()}-expansion-${number}`,
          color,
          number,
          expansion: true,
        });
      deck.push({
        id: `${color.toLowerCase()}-zero-fourteen`,
        color,
        number: 0,
        choice: true,
        expansion: true,
      });
    }
    deck.push({
      id: "wild-15",
      color: "YELLOW",
      number: 15,
      wild: true,
      expansion: true,
    });
    deck.push({ id: "maryThorne", type: "maryThorne" });
  }
  for (const [option, type] of [
    ["includeFirstMate", "firstMate"],
    ["includeStingray", "stingray"],
    ["includeDavyJones", "davyJones"],
    ["includeWalkThePlank", "walkThePlank"],
    ["includeLastVolley", "lastVolley"],
  ] as const)
    if (config[option]) deck.push({ id: type, type });
  return deck;
}

export const basicDeck: Card[] = buildDeck();

export const cardsMap: Map<string, Card> = new Map(
  Object.entries(
    basicDeck.reduce(
      (acc, card) => {
        acc[card.id] = card;
        return acc;
      },
      {} as { [key: string]: Card },
    ),
  ),
);
