import { randomUUID } from "crypto";
import { Card, Color, isColoredCard, isSpecialCard } from "./cards";
import type { Round } from "./game";
import { isRemovablePirate } from "./trickRules";
import { assert } from "./utils/assert";

export interface PlankChoice {
  id: string;
  playerId: string;
  cardIds: string[];
}

export function declareExpansionCard(
  card: Card,
  trickColor: Color | null,
  numberChoice?: number,
  colorChoice?: Color,
) {
  if (isColoredCard(card) && card.choice) {
    assert(
      numberChoice === 0 || numberChoice === 14,
      "Choose 0 or 14 before playing this card",
    );
    card.number = numberChoice;
  } else
    assert(numberChoice == null, "This card does not have a number choice");
  if (isColoredCard(card) && card.wild) {
    const color =
      trickColor && trickColor !== "BLACK"
        ? trickColor
        : (colorChoice ?? (trickColor === "BLACK" ? "YELLOW" : undefined));
    assert(
      color === "YELLOW" || color === "GREEN" || color === "PURPLE",
      "Wild 15 must be yellow, green, or purple",
    );
    assert(
      colorChoice == null || colorChoice === color,
      "Wild 15 must follow the lead suit",
    );
    card.color = color;
  } else assert(colorChoice == null, "This card does not have a suit choice");
}

export function preparePlankChoice(round: Round) {
  if (round.removedCardIds?.length) return;
  const plank = round.cardsPlayed.find(
    ({ card }) => isSpecialCard(card) && card.type === "walkThePlank",
  );
  if (!plank) return;
  const cardIds = round.cardsPlayed
    .filter(({ card }) => isRemovablePirate(card))
    .map(({ card }) => card.id);
  if (cardIds.length === 1) round.removedCardIds = cardIds;
  else if (cardIds.length > 1 && !round.plankChoice)
    round.plankChoice = { id: randomUUID(), playerId: plank.playerId, cardIds };
}

export function expansionTurnOrder(
  round: Round,
  order: number[],
  playerIds: string[],
) {
  const finalTrick = round.hands.length + 1 === round.cardsPerPlayer;
  const turns = order.filter(
    (index) => !finalTrick || round.volleyPlayerId !== playerIds[index],
  );
  if (!finalTrick) {
    const volley = round.cardsPlayed.find(
      ({ card }) => isSpecialCard(card) && card.type === "lastVolley",
    );
    if (volley) turns.push(playerIds.indexOf(volley.playerId));
  }
  return turns;
}
