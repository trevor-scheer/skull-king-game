import { Card, ColoredCard, SpecialCard } from "../types/graphqlTypes";

export function isSpecialCard(card: Card): card is SpecialCard {
  return card.__typename === "SpecialCard";
}

export function isColoredCard(card: Card): card is ColoredCard {
  return card.__typename === "ColoredCard";
}