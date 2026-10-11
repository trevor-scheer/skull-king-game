import { calculateRoundPoints } from "../scoring";

describe("classic scoring", () => {
  it.each([
    [0, 0, 50],
    [0, 1, -50],
    [0, 5, -50],
    [2, 2, 40],
    [2, 1, -10],
    [2, 4, -20],
  ])(
    "bid %i, won %i earns %i bid points",
    (tricksBid, tricksWon, bidPoints) => {
      expect(
        calculateRoundPoints({ roundNumber: 5, tricksBid, tricksWon })
          .bidPoints,
      ).toBe(bidPoints);
    },
  );

  it("retains exact-bid capture bonuses", () => {
    expect(
      calculateRoundPoints({
        roundNumber: 5,
        tricksBid: 2,
        tricksWon: 2,
        captureBonus: 70,
      }),
    ).toMatchObject({ bidPoints: 40, bonusPoints: 70 });
  });

  it("does not award captures for missed bids", () => {
    expect(
      calculateRoundPoints({
        roundNumber: 5,
        tricksBid: 2,
        tricksWon: 1,
        captureBonus: 70,
      }),
    ).toMatchObject({ bidPoints: -10, bonusPoints: 0 });
  });
});

describe("Rascal scoring", () => {
  it.each([
    [0, 0, 50],
    [2, 2, 50],
    [5, 5, 50],
    [0, 1, 25],
    [2, 1, 25],
    [2, 3, 25],
    [0, 2, 0],
    [2, 0, 0],
    [2, 5, 0],
  ])(
    "bid %i, won %i earns %i bid points",
    (tricksBid, tricksWon, bidPoints) => {
      expect(
        calculateRoundPoints({
          scoringMode: "rascal",
          roundNumber: 5,
          tricksBid,
          tricksWon,
        }).bidPoints,
      ).toBe(bidPoints);
    },
  );

  it.each([
    [2, 70],
    [1, 35],
    [0, 0],
  ])(
    "awards %i tricks' corresponding capture points (%i)",
    (tricksWon, capturePoints) => {
      expect(
        calculateRoundPoints({
          scoringMode: "rascal",
          roundNumber: 5,
          tricksBid: 2,
          tricksWon,
          captureBonus: 70,
        }).capturePoints,
      ).toBe(capturePoints);
    },
  );

  it("halves captures even after a missed zero bid", () => {
    expect(
      calculateRoundPoints({
        scoringMode: "rascal",
        roundNumber: 3,
        tricksBid: 0,
        tricksWon: 1,
        captureBonus: 10,
      }),
    ).toMatchObject({ bidPoints: 15, capturePoints: 5, bonusPoints: 5 });
  });
});

describe.each(["classic", "rascal"] as const)(
  "%s exact-only bonuses",
  (scoringMode) => {
    it("awards Loot and wagers on an exact zero bid", () => {
      expect(
        calculateRoundPoints({
          scoringMode,
          roundNumber: 5,
          tricksBid: 0,
          tricksWon: 0,
          exactBonus: 20,
          wager: 20,
        }),
      ).toMatchObject({
        bidPoints: 50,
        exactBonusPoints: 20,
        wagerPoints: 20,
        bonusPoints: 40,
      });
    });

    it.each([1, 2])(
      "denies Loot and loses full wager when off by %i",
      (difference) => {
        expect(
          calculateRoundPoints({
            scoringMode,
            roundNumber: 5,
            tricksBid: 0,
            tricksWon: difference,
            exactBonus: 20,
            wager: 20,
          }),
        ).toMatchObject({
          exactBonusPoints: 0,
          wagerPoints: -20,
          bonusPoints: -20,
        });
      },
    );

    it("keeps wager losses separate from capture points", () => {
      const points = calculateRoundPoints({
        scoringMode,
        roundNumber: 5,
        tricksBid: 2,
        tricksWon: 1,
        captureBonus: 70,
        exactBonus: 20,
        wager: 20,
      });
      expect(points.bonusPoints).toBe(scoringMode === "classic" ? -20 : 15);
      expect(points.wagerPoints).toBe(-20);
    });
  },
);
