import { Game } from "../game";
import { isSpecialCard } from "../cards";

function fixture(hands?: string[][], powers = false) {
  const game = new Game("ghost", { pirateAbilities: powers, deckConfig: { includeLoot: true } });
  const alice = game.addPlayer("Alice");
  const bob = game.addPlayer("Bob");
  game.start();
  const debug = game.__debugDump();
  const ghost = debug.players.find((player) => player.isAutomated)!;
  if (hands) {
    debug.currentRound!.roundNumber = hands[0].length;
    debug.players.forEach((player, index) => {
      player.hand = hands[index].map((id) => debug.deck.getCard(id)!);
      expect(player.hand.every(Boolean)).toBe(true);
    });
  }
  const tokens = new Map([["Alice", alice], ["Bob", bob]]);
  const play = (name: string, cardId: string) => game.playCard({ playerToken: tokens.get(name)!, cardId });
  const bid = () => { game.submitBid({ playerToken: alice, count: 0 }); game.submitBid({ playerToken: bob, count: 0 }); };
  return { game, debug, ghost, alice, bob, play, bid };
}

it("deals the official third hand, removes Loot, and keeps the ghost out of bids and scores", () => {
  const { game, debug, ghost, alice, bob } = fixture();
  expect(debug.players).toHaveLength(3);
  expect(debug.players.every((player) => player.hand.length === 1)).toBe(true);
  expect(debug.deck.getCard("loot-1")).toBeUndefined();
  debug.deck.shuffle();
  expect(debug.deck.getUndealtCards().some((card) => isSpecialCard(card) && card.type === "loot")).toBe(false);
  expect(game.getStateForPlayer().deckConfig.includeLoot).toBe(false);
  game.submitBid({ playerToken: alice, count: 0 });
  expect(game.getStateForPlayer(bob).players.every((player) => player.bid === null)).toBe(true);
  game.submitBid({ playerToken: bob, count: 0 });
  const state = game.getStateForPlayer();
  expect(state.currentRound!.phase).toBe("play");
  expect(state.players.find((player) => player.id === ghost.id)).toMatchObject({ hand: [], handCount: 1, bid: null, tricksWon: 0, isAutomated: true });
  expect(state.players.filter((player) => !player.isAutomated).map((player) => player.bid)).toEqual([0, 0]);
  expect(state.me).toBeUndefined();
  expect(state.legalCardIds).toEqual([]);
  expect(game.getStateForPlayer("stale").legalCardIds).toEqual([]);
});

it("reveals the ghost second without following suit, preserving its hidden remaining cards", () => {
  const { game, ghost, bob, alice, play, bid } = fixture([["yellow-1", "purple-1"], ["yellow-8", "green-1"], ["purple-14", "yellow-14"]]);
  bid();
  expect(game.getStateForPlayer(bob).legalCardIds).toEqual(["yellow-8", "green-1"]);
  play("Bob", "yellow-8");
  const state = game.getStateForPlayer(alice);
  expect(state.currentRound!.cardsPlayed.map((play) => play.playerId)).toEqual(["Bob", ghost.id]);
  expect(state.currentRound!.cardsPlayed[1].card.id).toBe("purple-14");
  expect(state.currentRound!.playerTurn).toBe("Alice");
  expect(state.legalCardIds).toEqual(["yellow-1"]);
  expect(state.players.find((player) => player.isAutomated)).toMatchObject({ hand: [], handCount: 1 });
  expect(game.getStateForPlayer(bob).legalCardIds).toEqual([]);
});

it("plays Tigress as Escape automatically", () => {
  const { game, play, bid } = fixture([["yellow-1"], ["yellow-8"], ["tigress"]]);
  bid(); play("Bob", "yellow-8"); play("Alice", "yellow-1");
  expect(game.getStateForPlayer().currentRound!.lastCompletedHand!.cardsPlayed[1].card).toMatchObject({ type: "tigress", selection: "escape" });
  expect(game.getStateForPlayer().currentRound!.lastCompletedHand!.winningCard!.playerId).toBe("Bob");
  game.advanceFromTrickResult();
  expect(game.getStateForPlayer().scorecard![0].map((block) => block.playerName)).toEqual(["Alice", "Bob"]);
  expect(game.getStateForPlayer().currentRound!.leader).toBe("Alice");
});

it("ghost leads after winning and the original round leader goes second", () => {
  const { game, ghost, play, bid } = fixture([["yellow-14", "yellow-1", "green-1"], ["yellow-8", "yellow-2", "green-2"], ["yellow-3", "pirate-1", "yellow-4"]]);
  bid(); play("Bob", "yellow-8"); play("Alice", "yellow-14");
  game.advanceFromTrickResult();
  expect(game.getStateForPlayer().currentRound!.playerTurn).toBe("Alice");
  play("Alice", "yellow-1"); play("Bob", "yellow-2");
  expect(game.getStateForPlayer().currentRound!.lastCompletedHand!.winningCard!.playerId).toBe(ghost.id);
  game.advanceFromTrickResult();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed[0].playerId).toBe(ghost.id);
  expect(game.getStateForPlayer().currentRound!.playerTurn).toBe("Bob");
});

it.each(["pirate-1", "pirate-2", "pirate-3", "pirate-4", "pirate-5"])("does not wait for a ghost's %s choice", (pirate) => {
  const { game, play, bid } = fixture([["yellow-1", "yellow-2"], ["yellow-3", "yellow-4"], [pirate, "yellow-5"]], true);
  bid(); play("Bob", "yellow-3"); play("Alice", "yellow-1");
  expect(game.getStateForPlayer().currentRound!.pirateAbility).toBeNull();
  expect(game.advanceFromTrickResult()).toBe(true);
  expect(game.getStateForPlayer().currentRound!.playerTurn).toBe("Bob");
});

it("lets Rosie choose the ghost to lead without exposing its hand", () => {
  const { game, ghost, alice, play, bid } = fixture([["pirate-1", "yellow-1"], ["yellow-3", "yellow-4"], ["yellow-5", "yellow-6"]], true);
  bid(); play("Bob", "yellow-3"); play("Alice", "pirate-1");
  const ability = game.getStateForPlayer(alice).currentRound!.pirateAbility!;
  expect(game.advanceFromTrickResult()).toBe(false);
  game.usePirateAbility(alice, ability.id, { action: "chooseLeader", playerId: ghost.id });
  game.advanceFromTrickResult();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed[0].playerId).toBe(ghost.id);
  expect(game.getStateForPlayer().currentRound!.playerTurn).toBe("Bob");
});

it("does not add an automated seat with three humans or the internal scripted duel mode", () => {
  for (const count of [2, 3]) {
    const game = new Game("seats", count === 2 ? { twoPlayerMode: "duel" } : undefined);
    for (let index = 0; index < count; index++) game.addPlayer(`P${index}`);
    game.start();
    expect(game.getStateForPlayer().players).toHaveLength(count);
    expect(game.getStateForPlayer().players.some((player) => player.isAutomated)).toBe(false);
  }
});

it("keeps a human named Graybeard's ghost distinct from the automatic seat", () => {
  const game = new Game("names");
  const token = game.addPlayer("Graybeard's ghost"); game.addPlayer("Bob"); game.start();
  const state = game.getStateForPlayer(token);
  expect(new Set(state.players.map((player) => player.id)).size).toBe(3);
  expect(state.me!.isAutomated).toBe(false);
});
