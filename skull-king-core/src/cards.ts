export type Card = ColoredCard | SpecialCard;

export type Color = "yellow" | "green" | "purple" | "black";
export interface ColoredCard {
  color: Color;
  number: number;
}

export function isColoredCard(card: Card): card is ColoredCard {
  return "color" in card && "number" in card;
}

export interface SpecialCard {
  type: "escape" | "pirate" | "tigress" | "skullKing";
  selection?: null | "pirate" | "escape";
}

export function isSpecialCard(card: Card): card is SpecialCard {
  return "type" in card;
}

export const colors: Color[] = ["yellow", "green", "purple", "black"];

const coloredCards: ColoredCard[] = colors
  .map((color) =>
    Array.from(Array(14)).map((_, index) => ({
      color,
      number: index + 1,
    }))
  )
  .flat();

const escapes: SpecialCard[] = Array.from(Array(5)).map(() => ({
  type: "escape",
}));

const pirates: SpecialCard[] = Array.from(Array(5)).map(() => ({
  type: "pirate",
}));

export const basicDeck: Card[] = [
  ...coloredCards.slice(),
  ...escapes.slice(),
  ...pirates.slice(),
  { type: "tigress" },
  { type: "skullKing" },
];
