import { randomUUID } from "crypto";
import { Card } from "../cards";
import { Scorecard } from "../scorecard";

const players = new Set(["Seth", "Trevor"]);
const nonBonusHand: Card[] = [
  { id: randomUUID(), type: "pirate" },
  { id: randomUUID(), type: "escape" },
];
const coloredBonusHand: Card[] = [
  { id: randomUUID(), type: "pirate" },
  { id: randomUUID(), color: "GREEN", number: 14 },
];
const blackBonusHand: Card[] = [
  { id: randomUUID(), type: "pirate" },
  { id: randomUUID(), color: "BLACK", number: 14 },
];
const skullKingBonusHand: Card[] = [
  { id: randomUUID(), type: "skullKing" },
  { id: randomUUID(), type: "pirate" },
];

describe("scorecard", () => {
  let scorecard: Scorecard;
  beforeEach(() => {
    scorecard = new Scorecard(players);
  });

  describe("zero bids", () => {
    it("correctly adds points for a correct zero bid", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 0],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Trevor", [nonBonusHand, nonBonusHand, nonBonusHand, nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(40);
    });
    it("correctly subtracts points for an incorrect zero bid", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 0],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [nonBonusHand]],
          ["Trevor", [nonBonusHand, nonBonusHand, nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(-40);
    });
  });
  describe("non-zero bids", () => {
    it("correctly subtracts points for incorrect bids", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 1],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [nonBonusHand, nonBonusHand, nonBonusHand]],
          ["Trevor", [nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(-20);
      expect(scorecard.getPlayerScore("Trevor")).toEqual(-10);
    });
    it("doesn't add bonus points for incorrect bids", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 1],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [coloredBonusHand, nonBonusHand, nonBonusHand]],
          ["Trevor", [nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(-20);
      expect(scorecard.getPlayerScore("Trevor")).toEqual(-10);
    });
    it("correctly adds points for correct bids", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 3],
          ["Trevor", 1],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [nonBonusHand, nonBonusHand, nonBonusHand]],
          ["Trevor", [nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(60);
      expect(scorecard.getPlayerScore("Trevor")).toEqual(20);
    });
    it("correctly adds bonus points for colored 14s (green, yellow, purple)", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 3],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [coloredBonusHand, nonBonusHand, nonBonusHand]],
          ["Trevor", [nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(70);
    });
    it("correctly adds bonus points for black 14", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 3],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [blackBonusHand, nonBonusHand, nonBonusHand]],
          ["Trevor", [nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(80);
    });
    it("correctly adds bonus points for pirates claimed by skull king", () => {
      scorecard.scoreRound({
        roundNumber: 4,
        bids: new Map([
          ["Seth", 3],
          ["Trevor", 2],
        ]),
        tricksWon: new Map<string, Card[][]>([
          ["Seth", [skullKingBonusHand, nonBonusHand, nonBonusHand]],
          ["Trevor", [nonBonusHand]],
        ]),
      });
      expect(scorecard.getPlayerScore("Seth")).toEqual(90);
    });
  });
});
