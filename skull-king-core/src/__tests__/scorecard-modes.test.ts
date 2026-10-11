import { Card } from "../cards";
import { Scorecard } from "../scorecard";

const capturedFourteen: Card[] = [
  { id: "pirate-1", type: "pirate" },
  { id: "yellow-14", color: "YELLOW", number: 14 },
];

describe("scorecard scoring modes", () => {
  it("uses Rascal scoring for all players and accumulates round totals", () => {
    const scorecard = new Scorecard(new Set(["Anne", "Mary"]), "rascal");
    scorecard.scoreRound({
      roundNumber: 3,
      bids: new Map([
        ["Anne", 0],
        ["Mary", 1],
      ]),
      tricksWon: new Map([["Mary", [capturedFourteen]]]),
    });
    expect(scorecard.getPlayerScore("Anne")).toBe(30);
    expect(scorecard.getPlayerScore("Mary")).toBe(40);

    scorecard.scoreRound({
      roundNumber: 4,
      bids: new Map([
        ["Anne", 0],
        ["Mary", 2],
      ]),
      tricksWon: new Map([["Anne", [capturedFourteen]]]),
    });
    expect(scorecard.getPlayerScore("Anne")).toBe(55);
    expect(scorecard.getPlayerScore("Mary")).toBe(40);
    expect(scorecard.getScoreCard()[1]).toEqual([
      {
        playerName: "Anne",
        tricksBid: 0,
        tricksWon: 1,
        bidPoints: 20,
        bonusPoints: 5,
        totalPoints: 55,
      },
      {
        playerName: "Mary",
        tricksBid: 2,
        tricksWon: 0,
        bidPoints: 0,
        bonusPoints: 0,
        totalPoints: 40,
      },
    ]);
  });

  it.each(["classic", "rascal"] as const)(
    "%s records full wager gains and losses without scaling them",
    (mode) => {
      const scorecard = new Scorecard(new Set(["Anne", "Mary"]), mode);
      scorecard.scoreRound({
        roundNumber: 3,
        bids: new Map([
          ["Anne", 0],
          ["Mary", 2],
        ]),
        tricksWon: new Map([["Mary", [capturedFourteen]]]),
        pirateWagers: new Map([
          ["Anne", 20],
          ["Mary", 20],
        ]),
      });
      expect(scorecard.getScoreCard()[0][0]).toMatchObject({
        bidPoints: 30,
        bonusPoints: 20,
        totalPoints: 50,
      });
      expect(scorecard.getScoreCard()[0][1]).toMatchObject(
        mode === "classic"
          ? {
              bidPoints: -10,
              bonusPoints: -20,
              totalPoints: -30,
            }
          : {
              bidPoints: 15,
              bonusPoints: -15,
              totalPoints: 0,
            },
      );
    },
  );

  it("keeps Classic as the default", () => {
    const scorecard = new Scorecard(new Set(["Anne"]));
    scorecard.scoreRound({
      roundNumber: 3,
      bids: new Map([["Anne", 1]]),
      tricksWon: new Map([["Anne", [capturedFourteen]]]),
    });
    expect(scorecard.getPlayerScore("Anne")).toBe(30);
  });
});
