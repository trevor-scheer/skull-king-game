import { Game } from "../game";
import { buildDeck } from "../cards";

function table(hands: string[][]) {
  const config = { includeExpansion: true, includeLastVolley: true };
  const cards = buildDeck(config);
  const game = new Game("ghost", {
    deckConfig: config,
    pirateAbilities: true,
    roundSchedule: [hands[0].length],
    tieBreakers: false,
  });
  const alice = game.addPlayer("Alice");
  const bob = game.addPlayer("Bob");
  game.start();
  const { players, currentRound: round } = game.__debugDump();
  hands.forEach(
    (ids, i) =>
      (players[i].hand = ids.map((id) => cards.find((c) => c.id === id)!)),
  );
  round!.leader = 0;
  round!.roundLeader = 0;
  game.submitBid({ playerToken: alice, count: 0 });
  game.submitBid({ playerToken: bob, count: 0 });
  return { game, alice, bob, players, round: round! };
}

test("Graybeard reveals Mary's forced card instead of his top card", () => {
  const t = table([
    ["maryThorne", "yellow-1", "yellow-2"],
    ["escape-1", "green-2", "yellow-3"],
    ["escape-2", "purple-1", "black-1"],
  ]);
  t.game.playCard({ playerToken: t.alice, cardId: "maryThorne" });
  t.game.playCard({ playerToken: t.bob, cardId: "escape-1" });
  const random = jest.spyOn(Math, "random").mockReturnValue(0.99);
  t.game.usePirateAbility(t.alice, t.round.pirateAbility!.id, {
    action: "forceCard",
    playerId: t.players[2].id,
  });
  random.mockRestore();
  t.game.advanceFromTrickResult();
  t.game.playCard({ playerToken: t.alice, cardId: "yellow-1" });
  expect(t.round.cardsPlayed[1].card.id).toBe("black-1");
  expect(t.players[2].hand.map((c) => c.id)).toEqual(["purple-1"]);
  expect(t.round.forcedCards?.has(t.players[2].id)).toBe(false);
});

test("Graybeard automatically plays Last Volley's extra turn and skips the actual final trick", () => {
  const t = table([
    ["yellow-1", "yellow-2", "yellow-3"],
    ["green-1", "green-2", "green-3"],
    ["lastVolley", "black-14", "escape-1"],
  ]);
  t.game.playCard({ playerToken: t.alice, cardId: "yellow-1" });
  t.game.playCard({ playerToken: t.bob, cardId: "green-1" });
  expect(t.round.lastCompletedHand!.cardsPlayed.map((p) => p.card.id)).toEqual([
    "yellow-1",
    "lastVolley",
    "green-1",
    "black-14",
  ]);
  expect(t.round.lastCompletedHand!.winningCard!.playerId).toBe(
    t.players[2].id,
  );
  t.game.advanceFromTrickResult();
  expect(t.round.cardsPlayed[0].card.id).toBe("escape-1");
  t.game.playCard({ playerToken: t.alice, cardId: "yellow-2" });
  t.game.playCard({ playerToken: t.bob, cardId: "green-2" });
  t.game.advanceFromTrickResult();
  t.game.playCard({ playerToken: t.alice, cardId: "yellow-3" });
  t.game.playCard({ playerToken: t.bob, cardId: "green-3" });
  expect(t.round.lastCompletedHand!.cardsPlayed).toHaveLength(2);
  t.game.advanceFromTrickResult();
  expect(t.game.getStateForPlayer().phase).toBe("postgame");
});

test("a Last Volley winner who skips the final trick yields its public leader to the next active player", () => {
  const t = table([
    ["yellow-1", "yellow-2"],
    ["green-1", "green-2"],
    ["lastVolley", "black-14"],
  ]);
  t.game.playCard({ playerToken: t.alice, cardId: "yellow-1" });
  t.game.playCard({ playerToken: t.bob, cardId: "green-1" });
  expect(t.round.lastCompletedHand!.winningCard!.playerId).toBe(
    t.players[2].id,
  );
  t.game.advanceFromTrickResult();
  expect(t.game.getStateForPlayer().currentRound).toMatchObject({
    leader: "Alice",
    playerTurn: "Alice",
  });
});
