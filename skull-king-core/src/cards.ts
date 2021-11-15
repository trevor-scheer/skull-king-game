import { randomUUID } from "crypto";

export type Card = ColoredCard | SpecialCard;

export type Color = "YELLOW" | "GREEN" | "PURPLE" | "BLACK";
export interface ColoredCard {
  id: string;
  color: Color;
  number: number;
}

export function isColoredCard(card: Card): card is ColoredCard {
  return "color" in card && "number" in card;
}

export type SpecialCardTypes = "escape" | "pirate" | "tigress" | "skullKing";
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
      id: randomUUID(),
      color,
      number: index + 1,
    }))
  )
  .flat();

const escapes: SpecialCard[] = Array.from(Array(5)).map(() => ({
  id: randomUUID(),
  type: "escape",
}));

const pirates: SpecialCard[] = Array.from(Array(5)).map(() => ({
  id: randomUUID(),
  type: "pirate",
}));

export const basicDeck: Card[] = [
  ...coloredCards.slice(),
  ...escapes.slice(),
  ...pirates.slice(),
  { id: randomUUID(), type: "tigress" },
  { id: randomUUID(), type: "skullKing" },
];

export const cardsMap: Map<string, Card> = new Map(
  Object.entries(
    basicDeck.reduce((acc, card) => {
      acc[card.id] = card;
      return acc;
    }, {} as { [key: string]: Card })
  )
);


