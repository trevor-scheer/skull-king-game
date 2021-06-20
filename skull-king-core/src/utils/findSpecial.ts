import { Card, isSpecialCard, SpecialCardTypes } from "../cards";

export function findSpecial(
  name: SpecialCardTypes,
  cards: Card[],
  selection?: "pirate" | "escape"
) {
  return cards.filter(
    (card) =>
      isSpecialCard(card) &&
      card.type === name &&
      (!selection || card.selection === selection)
  );
}
