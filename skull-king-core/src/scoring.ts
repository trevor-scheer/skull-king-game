export type ScoringMode = "classic" | "rascal";

export interface RoundPointsInput {
  scoringMode?: ScoringMode;
  roundNumber: number;
  tricksBid: number;
  tricksWon: number;
  captureBonus?: number;
  exactBonus?: number;
  wager?: number;
}

// Rascal scoring: https://www.grandpabecksgames.com/pages/skull-king
// Loot and pirate wagers still require exact bids under either scoring method.
export function calculateRoundPoints({
  scoringMode = "classic",
  roundNumber,
  tricksBid,
  tricksWon,
  captureBonus = 0,
  exactBonus = 0,
  wager = 0,
}: RoundPointsInput) {
  const difference = Math.abs(tricksBid - tricksWon);
  const exactBid = difference === 0;
  const bonusMultiplier =
    scoringMode === "rascal"
      ? exactBid
        ? 1
        : difference === 1
          ? 0.5
          : 0
      : exactBid
        ? 1
        : 0;

  let bidPoints: number;
  if (scoringMode === "rascal") {
    bidPoints = roundNumber * 10 * bonusMultiplier;
  } else if (tricksBid === 0) {
    bidPoints = roundNumber * 10 * (exactBid ? 1 : -1);
  } else {
    bidPoints = exactBid ? tricksWon * 20 : difference * -10;
  }

  const capturePoints = captureBonus * bonusMultiplier;
  const exactBonusPoints = exactBid ? exactBonus : 0;
  const wagerPoints = wager * (exactBid ? 1 : -1);

  return {
    bidPoints,
    capturePoints,
    exactBonusPoints,
    wagerPoints,
    bonusPoints: capturePoints + exactBonusPoints + wagerPoints,
  };
}
