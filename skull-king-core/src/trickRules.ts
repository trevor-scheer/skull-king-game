import { Card, Color, isColoredCard, isSpecialCard } from "./cards";
import type { PlayedCard } from "./game";

export function isEscapeCard(card: Card) {
  return (
    isSpecialCard(card) &&
    (card.type === "escape" ||
      card.type === "loot" ||
      (card.type === "tigress" && card.selection === "escape"))
  );
}

export function isPirateCard(card: Card) {
  return (
    isSpecialCard(card) &&
    (card.type === "pirate" ||
      (card.type === "tigress" && card.selection === "pirate"))
  );
}

export function activeSeaCreature(
  cards: Card[],
): "kraken" | "whiteWhale" | null {
  for (let index = cards.length - 1; index >= 0; index--) {
    const card = cards[index];
    if (
      isSpecialCard(card) &&
      (card.type === "kraken" || card.type === "whiteWhale")
    )
      return card.type;
  }
  return null;
}

function highestNumber(cards: PlayedCard[]) {
  return cards.reduce((highest, current) =>
    isColoredCard(current.card) &&
    isColoredCard(highest.card) &&
    current.card.number > highest.card.number
      ? current
      : highest,
  );
}

function normalWinner(
  cards: PlayedCard[],
  trickColor: Color | null,
): PlayedCard {
  const special = (type: string) =>
    cards.find(({ card }) => isSpecialCard(card) && card.type === type);
  const mermaid = special("mermaid");
  const skullKing = special("skullKing");
  if (mermaid && skullKing) return mermaid;
  if (skullKing) return skullKing;
  const pirate = cards.find(({ card }) => isPirateCard(card));
  if (pirate) return pirate;
  if (mermaid) return mermaid;
  const trump = cards.filter(
    ({ card }) => isColoredCard(card) && card.color === "BLACK",
  );
  if (trump.length) return highestNumber(trump);
  const suited = cards.filter(
    ({ card }) => isColoredCard(card) && card.color === trickColor,
  );
  if (suited.length) return highestNumber(suited);
  return cards[0];
}

export function determineTrickWinner(
  cards: PlayedCard[],
  trickColor: Color | null,
): { winner: PlayedCard; trickDiscarded: boolean } {
  if (!cards.length) throw new Error("Can't resolve an empty trick");
  const creature = activeSeaCreature(cards.map((play) => play.card));
  if (!creature)
    return { winner: normalWinner(cards, trickColor), trickDiscarded: false };

  if (creature === "whiteWhale") {
    const numbered = cards.filter(({ card }) => isColoredCard(card));
    if (numbered.length)
      return { winner: highestNumber(numbered), trickDiscarded: false };
  }

  // Ignore the active creature. A defeated creature acts as an Escape.
  const remaining = cards.filter(
    ({ card }) => !(isSpecialCard(card) && card.type === creature),
  );
  const lead = remaining.find(
    ({ card }) =>
      !isEscapeCard(card) &&
      !(
        isSpecialCard(card) &&
        (card.type === "kraken" || card.type === "whiteWhale")
      ),
  );
  const normalColor =
    trickColor ?? (lead && isColoredCard(lead.card) ? lead.card.color : null);
  return {
    winner: remaining.length ? normalWinner(remaining, normalColor) : cards[0],
    trickDiscarded: true,
  };
}
