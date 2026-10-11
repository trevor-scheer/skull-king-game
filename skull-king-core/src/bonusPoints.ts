import { Card, isColoredCard, isSpecialCard } from "./cards";
import type { Hand, Round } from "./game";
import {
  activeSeaCreature,
  determineTrickWinner,
  isEscapeCard,
  isPirateCard,
  isSeaCreature,
} from "./trickRules";

type BonusRound = Pick<Round, "tricksWon" | "bids"> &
  Partial<Pick<Round, "hands">>;

function captureBonus(hand: Hand) {
  if (hand.trickDiscarded || !hand.winningCard) return 0;
  const cards = hand.cardsPlayed
    .filter(({ card }) => !hand.removedCardIds?.includes(card.id))
    .map((play) => play.card);
  let points = cards.reduce(
    (sum, card) =>
      sum +
      (isColoredCard(card) && card.number === 14 && !card.choice
        ? card.color === "BLACK"
          ? 20
          : 10
        : 0),
    0,
  );
  if (
    activeSeaCreature(cards) === "whiteWhale" ||
    activeSeaCreature(cards) === "stingray"
  )
    return points;
  const winner = hand.winningCard.card;
  if (isPirateCard(winner)) {
    points +=
      20 *
      cards.filter((card) => isSpecialCard(card) && card.type === "mermaid")
        .length;
  } else if (isSpecialCard(winner) && winner.type === "skullKing") {
    points += 30 * cards.filter(isPirateCard).length;
  } else if (isSpecialCard(winner) && winner.type === "mermaid") {
    points +=
      40 *
      cards.filter((card) => isSpecialCard(card) && card.type === "skullKing")
        .length;
  }
  return points;
}

function legacyHand(cards: Card[], playerName: string): Hand {
  const cardsPlayed = cards.map((card, index) => ({
    id: String(index),
    playerId: playerName,
    card,
  }));
  const lead = cards.find((card) => !isEscapeCard(card));
  const trickColor = lead && isColoredCard(lead) ? lead.color : null;
  const result = cards.length
    ? determineTrickWinner(cardsPlayed, trickColor)
    : null;
  return {
    id: "legacy",
    cardsPlayed,
    trickColor,
    winningCard: result?.trickDiscarded ? null : (result?.winner ?? null),
    trickDiscarded: result?.trickDiscarded,
  };
}

export function scoreRoundBonuses(
  round: BonusRound,
  playerName: string,
): { captureBonus: number; lootBonus: number; expansionBonus: number } {
  const hands =
    round.hands ??
    (round.tricksWon.get(playerName) ?? []).map((cards) =>
      legacyHand(cards, playerName),
    );
  let captures = 0;
  let lootBonus = 0;
  let expansionBonus = 0;
  const exact = (name: string) =>
    round.bids.has(name) &&
    round.bids.get(name) === (round.tricksWon.get(name)?.length ?? 0);
  for (const hand of hands) {
    const surviving = hand.cardsPlayed.filter(
      ({ card }) => !hand.removedCardIds?.includes(card.id),
    );
    const davy = surviving.find(
      ({ card }) => isSpecialCard(card) && card.type === "davyJones",
    );
    if (davy?.playerId === playerName)
      expansionBonus +=
        20 * surviving.filter(({ card }) => isSeaCreature(card)).length;
    if (hand.trickDiscarded || !hand.winningCard) continue;
    const winner = hand.winningCard.playerId;
    if (winner === playerName) {
      captures += captureBonus(hand);
      for (const { card } of surviving) {
        if (isColoredCard(card) && card.expansion && !card.choice && !card.wild)
          expansionBonus += card.number === 7 ? -5 : card.number === 8 ? 5 : 0;
      }
      const winningCard = hand.winningCard.card;
      if (
        !activeSeaCreature(surviving.map(({ card }) => card)) &&
        isSpecialCard(winningCard) &&
        ["skullKing", "mermaid"].includes(winningCard.type)
      ) {
        expansionBonus +=
          30 *
          surviving.filter(
            ({ card }) => isSpecialCard(card) && card.type === "firstMate",
          ).length;
      }
    }
    if (
      activeSeaCreature(hand.cardsPlayed.map((play) => play.card)) ===
        "whiteWhale" ||
      activeSeaCreature(hand.cardsPlayed.map((play) => play.card)) ===
        "stingray"
    )
      continue;
    if (!exact(winner)) continue;
    for (const { card, playerId } of hand.cardsPlayed) {
      if (
        !isSpecialCard(card) ||
        card.type !== "loot" ||
        playerId === winner ||
        !exact(playerId)
      )
        continue;
      if (playerName === playerId || playerName === winner) lootBonus += 20;
    }
  }
  return { captureBonus: captures, lootBonus, expansionBonus };
}
