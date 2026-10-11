import { randomUUID } from "crypto";
import { Card, isSpecialCard } from "./cards";
import { Deck } from "./deck";
import type { Round } from "./game";
import { Player } from "./player";
import { assert } from "./utils/assert";

// IDs match the names printed on public/cards/pirate-1.jpg through pirate-5.jpg.
export const PIRATE_ABILITIES = {
  "pirate-1": { kind: "rosie", name: "Rosie D’Laney" },
  "pirate-2": { kind: "rascal", name: "Rascal of Roatan" },
  "pirate-3": { kind: "juanita", name: "Juanita Jade" },
  "pirate-4": { kind: "bendt", name: "Bendt the Bandit" },
  "pirate-5": { kind: "harry", name: "Harry the Giant" },
} as const;

export interface PirateAbility {
  id: string;
  playerId: string;
  pirateId: string;
  kind: "rosie" | "rascal" | "juanita" | "bendt" | "harry";
  name: string;
  stage: "choose" | "discard" | "view";
}

export interface PirateAbilityInput {
  action: "decline" | "chooseLeader" | "wager" | "draw" | "discard" | "reveal" | "finish" | "adjustBid";
  playerId?: string | null;
  cardIds?: string[] | null;
  amount?: number | null;
}

export function createPirateAbility(round: Round): PirateAbility | null {
  const winner = round.lastCompletedHand?.winningCard;
  if (!winner || !isSpecialCard(winner.card) || winner.card.type !== "pirate") return null;
  const pirate = PIRATE_ABILITIES[winner.card.id as keyof typeof PIRATE_ABILITIES];
  if (!pirate || (round.hands.length === round.roundNumber && pirate.kind !== "harry")) return null;
  return { ...pirate, id: randomUUID(), playerId: winner.playerId, pirateId: winner.card.id, stage: "choose" };
}

export function resolvePirateAbility(
  round: Round,
  players: Player[],
  deck: Deck,
  actor: string,
  expectedAbilityId: string,
  input: PirateAbilityInput,
): boolean {
  const ability = round.pirateAbility;
  if (!ability || ability.id !== expectedAbilityId) return false;
  assert(round.phase === "trick_result", "Pirate abilities must be used after their trick");
  assert(ability.playerId === actor, "Only the winning player can use this pirate ability");
  const player = players.find((candidate) => candidate.id === actor)!;
  const complete = () => { round.pirateAbility = null; };
  const nextStage = (stage: PirateAbility["stage"]) => {
    round.pirateAbility = { ...ability, id: randomUUID(), stage };
  };
  const noExtras = (allowed: ("playerId" | "cardIds" | "amount")[] = []) => {
    for (const field of ["playerId", "cardIds", "amount"] as const) {
      assert(input[field] == null || allowed.includes(field), "Unexpected pirate ability choice");
    }
  };

  if (input.action === "decline") {
    noExtras();
    assert(ability.stage === "choose", "Finish this pirate ability before continuing");
    complete();
    return true;
  }

  if (ability.kind === "rosie" && ability.stage === "choose" && input.action === "chooseLeader") {
    noExtras(["playerId"]);
    const leader = players.findIndex((candidate) => candidate.id === input.playerId);
    assert(leader >= 0, "Choose a player in this game to lead");
    round.leader = leader;
    complete();
  } else if (ability.kind === "rascal" && ability.stage === "choose" && input.action === "wager") {
    noExtras(["amount"]);
    assert(input.amount === 0 || input.amount === 10 || input.amount === 20, "Wager must be 0, 10, or 20 points");
    round.pirateWagers ??= new Map();
    round.pirateWagers.set(actor, (round.pirateWagers.get(actor) ?? 0) + input.amount);
    complete();
  } else if (ability.kind === "harry" && ability.stage === "choose" && input.action === "adjustBid") {
    noExtras(["amount"]);
    assert(input.amount === -1 || input.amount === 0 || input.amount === 1, "Change the bid by -1, 0, or 1");
    const bid = round.bids.get(actor);
    assert(bid != null, "Player has not bid");
    const adjusted = bid + input.amount;
    assert(adjusted >= 0 && adjusted <= round.roundNumber, "Adjusted bid must fit the round");
    round.bids.set(actor, adjusted);
    complete();
  } else if (ability.kind === "bendt" && ability.stage === "choose" && input.action === "draw") {
    noExtras();
    const cards = deck.drawMany(2);
    player.hand.push(...cards);
    nextStage("discard");
  } else if (ability.kind === "bendt" && ability.stage === "discard" && input.action === "discard") {
    noExtras(["cardIds"]);
    const ids = input.cardIds;
    assert(ids?.length === 2 && new Set(ids).size === 2, "Choose two different cards to discard");
    assert(ids.every((id) => player.hand.some((card) => card.id === id)), "Discard only cards in your hand");
    player.hand = player.hand.filter((card) => !ids.includes(card.id));
    complete();
  } else if (ability.kind === "juanita" && ability.stage === "choose" && input.action === "reveal") {
    noExtras();
    nextStage("view");
  } else if (ability.kind === "juanita" && ability.stage === "view" && input.action === "finish") {
    noExtras();
    complete();
  } else {
    throw new Error("This choice is not available for the current pirate ability");
  }
  return true;
}

export function pirateAbilityForPlayer(round: Round, actor: string | undefined, deck: Deck) {
  const ability = round.pirateAbility;
  if (!ability) return null;
  const privateCards: Card[] = ability.playerId === actor && ability.kind === "juanita" && ability.stage === "view"
    ? deck.getUndealtCards()
    : [];
  return { ...ability, privateCards };
}
