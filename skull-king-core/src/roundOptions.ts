import { assert } from "./utils/assert";

export const ROUND_PRESETS = {
  standard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  evenKeeled: [2, 4, 6, 8, 10],
  skipToTheBrawl: [6, 7, 8, 9, 10],
  swiftAndSalty: [5, 5, 5, 5, 5],
  broadsideBarrage: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  whirlpool: [9, 9, 7, 7, 5, 5, 3, 3, 1, 1],
  pastYourBedtime: [1],
} as const;

export function validateRoundSchedule(
  schedule: readonly number[] = ROUND_PRESETS.standard,
): number[] {
  assert(
    Array.isArray(schedule) && schedule.length >= 1 && schedule.length <= 20,
    "Choose between 1 and 20 rounds",
  );
  assert(
    schedule.every(
      (count) => Number.isInteger(count) && count >= 1 && count <= 10,
    ),
    "Each round must deal between 1 and 10 cards per player",
  );
  return [...schedule];
}

export function cardsForRound(
  schedule: readonly number[],
  roundNumber: number,
  deckSize: number,
  seats: number,
): number {
  const requested = schedule[Math.min(roundNumber, schedule.length) - 1];
  const available = Math.floor(deckSize / seats);
  assert(available > 0, "Not enough cards to deal to every player");
  return Math.min(requested, available);
}

export function hasTiedLeaders(scores: number[]): boolean {
  const best = Math.max(...scores);
  return scores.filter((score) => score === best).length > 1;
}
