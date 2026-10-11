import { Card, isSpecialCard } from "./cards";
import type { Player } from "./player";

export function createGraybeard(players: Player[]): Player {
  let name = "Graybeard's ghost";
  while (players.some((player) => player.name === name)) name += " 👻";
  return { id: name, name, hand: [], isAutomated: true };
}

export function graybeardTurnOrder(players: Player[], leader: number, roundLeader: number) {
  const ghost = players.findIndex((player) => player.isAutomated);
  if (ghost < 0) return null;
  const firstHuman = leader === ghost ? roundLeader : leader;
  const otherHuman = players.findIndex((player, index) => !player.isAutomated && index !== firstHuman);
  return leader === ghost ? [ghost, firstHuman, otherHuman] : [leader, ghost, otherHuman];
}

export function graybeardCard(card: Card): Card {
  return isSpecialCard(card) && card.type === "tigress" ? { ...card, selection: "escape" } : { ...card };
}

export function allowedWithGraybeard(card: Card) {
  return card.id !== "wild-15" && !("choice" in card && card.choice) &&
    !(isSpecialCard(card) && ["loot", "walkThePlank"].includes(card.type));
}
