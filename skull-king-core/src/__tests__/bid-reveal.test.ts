import { Game } from "../game";

function readyGame(cannonball = false) {
  const game = new Game("ritual", {
    bidRevealDurationMs: 4500,
    cannonball,
    scoringMode: cannonball ? "rascal" : "classic",
  });
  const tokens = ["Anne", "Mary", "Jack"].map(name => game.addPlayer(name));
  game.start();
  return { game, tokens };
}

afterEach(() => jest.restoreAllMocks());

test.each([false, true])("locked bids wait for the deadline before %s cannonball play", cannonball => {
  jest.spyOn(Date, "now").mockReturnValue(100_000);
  const { game, tokens } = readyGame(cannonball);
  tokens.slice(0, 2).forEach(playerToken => game.submitBid({ playerToken, count: 0 }));
  expect(game.getStateForPlayer().currentRound!.bidRevealEndsAt).toBeNull();
  expect(game.advanceFromBidReveal(1, 200_000)).toBe(false);
  game.submitBid({ playerToken: tokens[2], count: 1 });

  const publicState = game.getStateForPlayer();
  expect(publicState.currentRound).toMatchObject({ phase: "bid", bidRevealEndsAt: 104_500, revealedBids: [], playerTurn: null });
  expect(publicState.players.every(player => player.bid === null)).toBe(true);
  expect(game.getStateForPlayer(tokens[2]).currentRound!.myBid).toBe(1);
  expect(game.getStateForPlayer(tokens[2]).legalCardIds).toEqual([]);
  expect(() => game.submitBid({ playerToken: tokens[2], count: 0 })).toThrow("multiple bids");
  const card = game.getStateForPlayer(tokens[0]).me!.hand[0];
  expect(() => game.playCard({ playerToken: tokens[0], cardId: card.id })).toThrow("outside of play phase");
  expect(game.advanceFromBidReveal(2, 104_500)).toBe(false);
  expect(game.advanceFromBidReveal(1, 104_499)).toBe(false);
  expect(game.advanceFromBidReveal(1, Number.NaN)).toBe(false);
  expect(game.advanceFromBidReveal(1, 104_500)).toBe(true);
  expect(game.getStateForPlayer().currentRound).toMatchObject({
    phase: cannonball ? "load" : "play", bidRevealEndsAt: null,
    revealedBids: [{ playerId: "Anne", count: 0 }, { playerId: "Mary", count: 0 }, { playerId: "Jack", count: 1 }],
  });
  expect(game.advanceFromBidReveal(1, 104_500)).toBe(false);
});

test("autoplay cannot play through the chant and checkpoint restoration keeps the deadline", () => {
  jest.spyOn(Date, "now").mockReturnValue(100_000);
  const { game, tokens } = readyGame();
  tokens.forEach(token => game.setAutoplay(token, true));
  expect(game.stepAutoplay()).toBe(true);
  expect(game.stepAutoplay()).toBe(true);
  expect(game.stepAutoplay()).toBe(true);
  const restored = Game.restoreCheckpoint(game.checkpoint());
  expect(restored.getStateForPlayer().currentRound!.bidRevealEndsAt).toBe(104_500);
  expect(restored.stepAutoplay()).toBe(false);
  expect(restored.getStateForPlayer().currentRound!.cardsPlayed).toEqual([]);
  expect(restored.advanceFromBidReveal(1, 104_500)).toBe(true);
  expect(restored.stepAutoplay()).toBe(true);
  expect(restored.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
});
