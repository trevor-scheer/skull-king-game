import { Card, isColoredCard, isSpecialCard } from "./cards";
import type { Hand, Round } from "./game";
import {
  activeSeaCreature,
  determineTrickWinner,
  isEscapeCard,
  isPirateCard,
} from "./trickRules";

type BonusRound = Pick<Round, "tricksWon" | "bids"> &
  Partial<Pick<Round, "hands">>;

function captureBonus(hand: Hand) {
  if (hand.trickDiscarded || !hand.winningCard) return 0;
  const cards = hand.cardsPlayed.map((play) => play.card);
  let points = cards.reduce(
    (sum, card) =>
      sum +
      (isColoredCard(card) && card.number === 14
        ? card.color === "BLACK"
          ? 20
          : 10
        : 0),
    0,
  );
  if (activeSeaCreature(cards) === "whiteWhale") return points;
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
): { captureBonus: number; lootBonus: number } {
  const hands =
    round.hands ??
    (round.tricksWon.get(playerName) ?? []).map((cards) =>
      legacyHand(cards, playerName),
    );
  let captures = 0;
  let lootBonus = 0;
  const exact = (name: string) =>
    round.bids.has(name) &&
    round.bids.get(name) === (round.tricksWon.get(name)?.length ?? 0);
  for (const hand of hands) {
    if (hand.trickDiscarded || !hand.winningCard) continue;
    const winner = hand.winningCard.playerId;
    if (winner === playerName) captures += captureBonus(hand);
    if (
      activeSeaCreature(hand.cardsPlayed.map((play) => play.card)) ===
      "whiteWhale"
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
  return { captureBonus: captures, lootBonus };
}
