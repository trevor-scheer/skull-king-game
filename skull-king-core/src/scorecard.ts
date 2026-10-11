import { Round } from "./game";
import { scoreRoundBonuses } from "./bonusPoints";
import { calculateRoundPoints, ScoringMode } from "./scoring";

type ScoredRound = Map<string, ScoreBlock>;

export interface ScoreBlock {
  playerName: string;
  tricksBid: number;
  tricksWon: number;
  bidPoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export class Scorecard {
  private rounds: ScoredRound[] = [];

  constructor(
    private playerNames: Set<string>,
    private scoringMode: ScoringMode = "classic",
  ) {}

  public scoreRound(
    round: Pick<Round, "tricksWon" | "bids" | "roundNumber"> &
      Partial<Pick<Round, "hands" | "cardsPerPlayer" | "cannonLoads">> & {
        pirateWagers?: Map<string, number>;
      },
  ) {
    const scoredRound: ScoredRound = new Map();
    const { tricksWon, bids, roundNumber } = round;

    for (const playerName of this.playerNames) {
      const tricksBid = bids.get(playerName);

      if (tricksBid == null)
        throw new Error("Programming error: missing player bid");

      const playerTricks = tricksWon.get(playerName) ?? [];
      const numTricksWon = playerTricks.length;

      const bonuses = scoreRoundBonuses(round, playerName);
      const { bidPoints, bonusPoints } = calculateRoundPoints({
        scoringMode: this.scoringMode,
        roundNumber,
        cardsPerPlayer: round.cardsPerPlayer,
        cannonLoad: round.cannonLoads?.get(playerName),
        tricksBid,
        tricksWon: numTricksWon,
        captureBonus: bonuses.captureBonus,
        exactBonus: bonuses.lootBonus,
        wager: round.pirateWagers?.get(playerName),
      });
      const scoreBlock: ScoreBlock = {
        playerName,
        tricksBid,
        tricksWon: numTricksWon,
        bidPoints,
        bonusPoints,
        totalPoints: this.getPlayerScore(playerName) + bidPoints + bonusPoints,
      };
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

  public getScoreCard() {
    return this.rounds.map((round) => Array.from(round.values()));
  }
}
