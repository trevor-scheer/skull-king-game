import { Card, isColoredCard } from "./cards";
import { Round } from "./game";
import { findSpecial } from "./utils/findSpecial";

type Round = Map<string, ScoreBlock>;

export interface ScoreBlock {
  playerName: string;
  tricksBid: number;
  tricksWon: number;
  bidPoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export class Scorecard {
  private rounds: Round[] = [];

  constructor(private playerNames: Set<string>) {}

  public scoreRound(
    round: Pick<Round, "tricksWon" | "bids" | "roundNumber">
  ) {
    const scoredRound: Round = new Map();
    const { tricksWon, bids, roundNumber } = round;

    for (const playerName of this.playerNames) {
      const tricksBid = bids.get(playerName);

      if (tricksBid == null)
        throw new Error("Programming error: missing player bid");

      const playerTricks = tricksWon.get(playerName) ?? [];
      const numTricksWon = playerTricks.length;

      let scoreBlock: ScoreBlock;
      // 0 bid case
      if (tricksBid === 0) {
        const bidCorrectly = numTricksWon === 0;
        const bidPoints = 10 * roundNumber * (bidCorrectly ? 1 : -1);
        scoreBlock = {
          playerName,
          tricksBid,
          tricksWon: numTricksWon,
          bidPoints,
          bonusPoints: 0,
          totalPoints: this.getPlayerScore(playerName) + bidPoints,
        };
        // correct bid case
      } else if (tricksBid === playerTricks.length) {
        const bidPoints = numTricksWon * 20;
        const bonusPoints = this.scoreBonusPoints(playerTricks);
        // score hands
        scoreBlock = {
          playerName,
          tricksBid,
          tricksWon: numTricksWon,
          bidPoints,
          bonusPoints,
          totalPoints:
            this.getPlayerScore(playerName) + bidPoints + bonusPoints,
        };
        // incorrect bid case
      } else {
        const diff = Math.abs(tricksBid - numTricksWon);
        const bidPoints = -10 * diff;
        scoreBlock = {
          playerName,
          tricksBid,
          tricksWon: numTricksWon,
          bidPoints,
          bonusPoints: 0,
          totalPoints: this.getPlayerScore(playerName) + bidPoints,
        };
      }
      scoredRound.set(playerName, scoreBlock);
    }
    this.rounds.push(scoredRound);
  }

  public getPlayerScore(playerName: string) {
    if (this.rounds.length === 0) return 0;
    const lastRound = this.rounds[this.rounds.length - 1];
    const playerScore = lastRound.get(playerName);
    if (!playerScore)
      throw new Error("Programming error, can't find player score");
    return playerScore.totalPoints;
  }

  private scoreBonusPoints(tricks: Card[][]) {
    const roundScore = tricks.reduce((sum, hand) => {
      // sum pirates captured
      if (findSpecial("skullKing", hand).length === 1) {
        const pirateCount = findSpecial("pirate", hand).length;
        const pirateTigressCount = findSpecial(
          "tigress",
          hand,
          "pirate"
        ).length;
        sum += 30 * (pirateCount + pirateTigressCount);
      }
      // number 14 bonuses
      for (const card of hand) {
        if (isColoredCard(card) && card.number === 14) {
          if (card.color === "BLACK") sum += 20;
          if (card.color !== "BLACK") sum += 10;
        }
      }
      return sum;
    }, 0);
    return roundScore;
  }

  public getScoreCard() {
    return this.rounds.map((round) => Array.from(round.values()));
  }
}
