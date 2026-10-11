import { buildDeck, isColoredCard, isSpecialCard } from "../cards";
import { Deck } from "../deck";
import { Game } from "../game";
import { ROUND_PRESETS, validateRoundSchedule } from "../roundOptions";
import { calculateRoundPoints } from "../scoring";

function crew(game: Game, count = 3) {
  const tokens = new Map<string, string>();
  for (let i = 0; i < count; i++)
    tokens.set(`Player ${i + 1}`, game.addPlayer(`Player ${i + 1}`));
  game.start();
  return tokens;
}

function finishRound(game: Game, tokens: Map<string, string>) {
  const round = game.__debugDump().currentRound!;
  const number = round.roundNumber;
  for (const token of tokens.values())
    game.submitBid({ playerToken: token, count: 0 });
  while (game.__debugDump().currentRound?.roundNumber === number) {
    const state = game.getStateForPlayer();
    const current = state.currentRound!;
    if (current.phase === "trick_result") {
      game.advanceFromTrickResult(current.lastCompletedHand!.id);
      continue;
    }
    const token = tokens.get(current.playerTurn!)!;
    const hand = game.getStateForPlayer(token).me!.hand;
    const card =
      hand.find(
        (card) => isColoredCard(card) && card.color === current.trickColor,
      ) ?? hand[0];
    game.playCard({
      playerToken: token,
      cardId: card.id,
      selection:
        isSpecialCard(card) && card.type === "tigress" ? "escape" : undefined,
    });
  }
}

describe("round schedules", () => {
  it("matches the current rulebook presets, including five-round Even Keeled", () => {
    expect(ROUND_PRESETS.standard).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(ROUND_PRESETS.evenKeeled).toEqual([2, 4, 6, 8, 10]);
    expect(ROUND_PRESETS.skipToTheBrawl).toEqual([6, 7, 8, 9, 10]);
    expect(ROUND_PRESETS.swiftAndSalty).toEqual([5, 5, 5, 5, 5]);
    expect(ROUND_PRESETS.broadsideBarrage).toEqual(Array(10).fill(10));
    expect(ROUND_PRESETS.whirlpool).toEqual([9, 9, 7, 7, 5, 5, 3, 3, 1, 1]);
    expect(ROUND_PRESETS.pastYourBedtime).toEqual([1]);
  });

  it.each(
    [[], [0], [11], [-1], [1.5], [NaN], Array(21).fill(1)].map((schedule) => [
      schedule,
    ]),
  )("rejects invalid schedule %j", (schedule) => {
    expect(() => new Game("invalid", { roundSchedule: schedule })).toThrow();
  });

  it("copies the schedule so caller edits cannot change an active game", () => {
    const schedule = [5, 2];
    const game = new Game("custom", { roundSchedule: schedule });
    schedule[0] = 10;
    const publicSchedule = game.getStateForPlayer().roundSchedule;
    publicSchedule[0] = 1;
    expect(game.getStateForPlayer().roundSchedule).toEqual([5, 2]);
    expect(validateRoundSchedule()).toEqual(ROUND_PRESETS.standard);
  });

  it("deals custom hand sizes, validates bids, and ends at the schedule length", () => {
    const game = new Game("custom", {
      roundSchedule: [5, 2],
      tieBreakers: false,
    });
    const tokens = crew(game);
    expect(
      game.getStateForPlayer(tokens.values().next().value).me!.hand,
    ).toHaveLength(5);
    expect(game.getStateForPlayer().currentRound).toMatchObject({
      roundNumber: 1,
      cardsPerPlayer: 5,
      isTieBreaker: false,
    });
    expect(() =>
      game.submitBid({ playerToken: tokens.values().next().value!, count: 6 }),
    ).toThrow("more than");
    finishRound(game, tokens);
    expect(game.getStateForPlayer().currentRound).toMatchObject({
      roundNumber: 2,
      cardsPerPlayer: 2,
    });
    for (const token of tokens.values())
      expect(game.getStateForPlayer(token).me!.hand).toHaveLength(2);
    finishRound(game, tokens);
    const state = game.getStateForPlayer();
    expect(state.phase).toBe("postgame");
    expect(state.scorecard).toHaveLength(2);
    for (const score of state.scorecard![0])
      expect(Math.abs(score.bidPoints)).toBe(50);
    for (const score of state.scorecard![1])
      expect(Math.abs(score.bidPoints)).toBe(20);
  });
});

describe("table capacity", () => {
  it("accepts eight players, rejects a ninth, and deals equal capped hands", () => {
    const game = new Game("eight", { roundSchedule: [10], tieBreakers: false });
    const tokens = new Map<string, string>();
    for (let i = 0; i < 8; i++)
      tokens.set(String(i), game.addPlayer(String(i)));
    expect(() => game.addPlayer("ninth")).toThrow("8 players");
    expect(game.getStateForPlayer().maxPlayers).toBe(8);
    game.start();
    expect(game.getStateForPlayer().currentRound!.cardsPerPlayer).toBe(8);
    for (const token of tokens.values())
      expect(game.getStateForPlayer(token).me!.hand).toHaveLength(8);
    finishRound(game, tokens);
    for (const score of game.getStateForPlayer().scorecard![0])
      expect(Math.abs(score.bidPoints)).toBe(80);
  });

  it("supports a ninth seat with the larger expansion deck", () => {
    const customDeck = [
      ...buildDeck(),
      { id: "wild-15", color: "YELLOW" as const, number: 15 },
    ];
    const game = new Game("nine", {
      deck: new Deck({ customDeck }),
      roundSchedule: [10],
    });
    const tokens = crew(game, 9);
    expect(game.getStateForPlayer().maxPlayers).toBe(9);
    expect(game.getStateForPlayer().currentRound!.cardsPerPlayer).toBe(7);
    for (const token of tokens.values())
      expect(game.getStateForPlayer(token).me!.hand).toHaveLength(7);
  });
});

describe("pirate powers with custom hand sizes", () => {
  it.each(["pirate-1", "pirate-5"])(
    "uses the actual five-card hand for %s availability and bid bounds",
    (pirateId) => {
      const dealt = [
        { id: "escape-1", type: "escape" as const },
        { id: pirateId, type: "pirate" as const },
        { id: "escape-2", type: "escape" as const },
        ...Array.from({ length: 12 }, (_, i) => ({
          id: `yellow-${i + 1}`,
          color: "YELLOW" as const,
          number: i + 1,
        })),
      ];
      const game = new Game("powers", {
        deck: new Deck({ customDeck: dealt.reverse(), shuffleSeed: 0.99 }),
        roundSchedule: [5],
        pirateAbilities: true,
      });
      const tokens = crew(game);
      for (const [name, token] of tokens)
        game.submitBid({
          playerToken: token,
          count: name === "Player 1" ? 4 : 0,
        });
      for (let i = 0; i < 3; i++) {
        const token = tokens.get(
          game.getStateForPlayer().currentRound!.playerTurn!,
        )!;
        game.playCard({
          playerToken: token,
          cardId: game.getStateForPlayer(token).me!.hand[0].id,
        });
      }
      const ability = game.getStateForPlayer().currentRound!.pirateAbility!;
      expect(ability).toMatchObject({ pirateId, playerId: "Player 1" });
      if (pirateId === "pirate-5") {
        game.usePirateAbility(tokens.get("Player 1")!, ability.id, {
          action: "adjustBid",
          amount: 1,
        });
        expect(
          game.getStateForPlayer(tokens.get("Player 1")).currentRound!.myBid,
        ).toBe(5);
      }
    },
  );
});

describe("tied games", () => {
  it("repeats the final hand size until one player leads and announces the end once", () => {
    const deck = new Deck({
      customDeck: [1, 2, 3].map((number) => ({
        id: `yellow-${number}`,
        color: "YELLOW",
        number,
      })),
      shuffleSeed: 0.99,
    });
    const game = new Game("tie", { deck, roundSchedule: [1] });
    const onEnd = jest.fn();
    game.onGameEnd(onEnd);
    const tokens = crew(game);
    finishRound(game, tokens);
    expect(game.getStateForPlayer().currentRound).toMatchObject({
      roundNumber: 2,
      cardsPerPlayer: 1,
      isTieBreaker: true,
    });
    expect(onEnd).not.toHaveBeenCalled();
    finishRound(game, tokens);
    expect(game.getStateForPlayer()).toMatchObject({
      phase: "postgame",
      currentRound: null,
    });
    expect(game.getStateForPlayer().scorecard).toHaveLength(2);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(game.advanceFromTrickResult("old-hand")).toBe(false);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it("can explicitly finish a custom game with shared winners", () => {
    const game = new Game("shared", { roundSchedule: [1], tieBreakers: false });
    finishRound(game, crew(game));
    expect(game.getStateForPlayer().phase).toBe("postgame");
  });
});

describe("scoring actual cards dealt", () => {
  it.each(["classic", "rascal"] as const)(
    "%s uses hand size, not the ordinal round",
    (scoringMode) => {
      expect(
        calculateRoundPoints({
          scoringMode,
          roundNumber: 1,
          cardsPerPlayer: 5,
          tricksBid: 0,
          tricksWon: 0,
        }).bidPoints,
      ).toBe(50);
      expect(
        calculateRoundPoints({
          scoringMode,
          roundNumber: 12,
          cardsPerPlayer: 1,
          tricksBid: 0,
          tricksWon: 0,
        }).bidPoints,
      ).toBe(10);
    },
  );

  it.each([
    [2, 90, 70],
    [1, 0, -20],
    [0, 0, -20],
  ])(
    "Cannonball with %i tricks keeps exact-only bonuses and full wagers",
    (tricksWon, bidPoints, bonusPoints) => {
      expect(
        calculateRoundPoints({
          scoringMode: "rascal",
          cannonLoad: "cannonball",
          roundNumber: 1,
          cardsPerPlayer: 6,
          tricksBid: 2,
          tricksWon,
          captureBonus: 30,
          exactBonus: 20,
          wager: 20,
        }),
      ).toMatchObject({ bidPoints, bonusPoints });
    },
  );
});
