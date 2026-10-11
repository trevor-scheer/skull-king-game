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
      card.type === "maryThorne" ||
      (card.type === "tigress" && card.selection === "pirate"))
  );
}

export function isRemovablePirate(card: Card) {
  return (
    isSpecialCard(card) &&
    (card.type === "pirate" || card.type === "maryThorne")
  );
}

export function isSeaCreature(card: Card) {
  return (
    isSpecialCard(card) &&
    ["kraken", "whiteWhale", "stingray"].includes(card.type)
  );
}

export function defersLeadSuit(card: Card) {
  return (
    isEscapeCard(card) ||
    (isSpecialCard(card) &&
      ["lastVolley", "walkThePlank", "davyJones", "stingray"].includes(
        card.type,
      ))
  );
}

export function activeSeaCreature(
  cards: Card[],
): "kraken" | "whiteWhale" | "stingray" | null {
  if (cards.some((card) => isSpecialCard(card) && card.type === "davyJones"))
    return null;
  for (let index = cards.length - 1; index >= 0; index--) {
    const card = cards[index];
    if (isSpecialCard(card) && isSeaCreature(card))
      return card.type as "kraken" | "whiteWhale" | "stingray";
  }
  return null;
}

function extremeNumber(cards: PlayedCard[], lowest = false) {
  return cards.reduce((best, current) =>
    isColoredCard(current.card) &&
    isColoredCard(best.card) &&
    (lowest
      ? current.card.number < best.card.number
      : current.card.number > best.card.number)
      ? current
      : best,
  );
}

function normalWinner(
  cards: PlayedCard[],
  trickColor: Color | null,
): PlayedCard | undefined {
  const special = (type: string) =>
    cards.find(({ card }) => isSpecialCard(card) && card.type === type);
  const mermaid = special("mermaid");
  const skullKing = special("skullKing");
  const firstMate = special("firstMate");
  if (mermaid && (skullKing || firstMate)) return mermaid;
  if (skullKing) return skullKing;
  if (firstMate) return firstMate;
  const pirate = cards.find(({ card }) => isPirateCard(card));
  if (pirate) return pirate;
  if (mermaid) return mermaid;
  const trump = cards.filter(
    ({ card }) => isColoredCard(card) && card.color === "BLACK",
  );
  if (trump.length) return extremeNumber(trump);
  const suited = cards.filter(
    ({ card }) => isColoredCard(card) && card.color === trickColor,
  );
  if (suited.length) return extremeNumber(suited);
  return cards.find(({ card }) => isEscapeCard(card));
}

export function determineTrickWinner(
  original: PlayedCard[],
  trickColor: Color | null,
  removedCardIds: string[] = [],
): { winner: PlayedCard; trickDiscarded: boolean } {
  if (!original.length) throw new Error("Can't resolve an empty trick");
  const davy = original.some(
    ({ card }) => isSpecialCard(card) && card.type === "davyJones",
  );
  const cards = original.filter(
    ({ card }) =>
      !removedCardIds.includes(card.id) &&
      !(
        davy &&
        (isSeaCreature(card) ||
          (isSpecialCard(card) && card.type === "davyJones"))
      ),
  );
  const creature = activeSeaCreature(cards.map((play) => play.card));
  if (!creature) {
    // Davy Jones removes monsters before resolving the ordinary lead suit.
    const lead = cards.find(({ card }) => !defersLeadSuit(card));
    const color =
      (davy || removedCardIds.length > 0) && lead && isColoredCard(lead.card)
        ? lead.card.color
        : trickColor;
    const winner = normalWinner(cards, color);
    return { winner: winner ?? original[0], trickDiscarded: !winner };
  }
  if (creature === "whiteWhale" || creature === "stingray") {
    const numbered = cards.filter(({ card }) => isColoredCard(card));
    if (numbered.length)
      return {
        winner: extremeNumber(numbered, creature === "stingray"),
        trickDiscarded: false,
      };
    // Expansion page 10 explicitly lets the first Escape win an otherwise
    // nonwinning-special/Escape trick containing the Stingray.
    if (
      creature === "stingray" &&
      cards.every(
        ({ card }) =>
          isEscapeCard(card) ||
          (isSpecialCard(card) &&
            ["stingray", "lastVolley", "walkThePlank", "davyJones"].includes(
              card.type,
            )),
      )
    ) {
      const escape = cards.find(({ card }) => isEscapeCard(card));
      if (escape) return { winner: escape, trickDiscarded: false };
    }
  }
  const remaining = cards.filter(({ card }) => !isSeaCreature(card));
  const lead = remaining.find(({ card }) => !defersLeadSuit(card));
  const normalColor =
    trickColor ?? (lead && isColoredCard(lead.card) ? lead.card.color : null);
  return {
    winner: normalWinner(remaining, normalColor) ?? original[0],
    trickDiscarded: true,
  };
}
