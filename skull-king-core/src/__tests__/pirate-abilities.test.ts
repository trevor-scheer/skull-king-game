import { pirateGame } from "../../testUtils/pirateGame";
import { createPirateAbility, PIRATE_ABILITIES } from "../pirateAbilities";

const abilityId = (game: ReturnType<typeof pirateGame>["game"]) => game.getStateForPlayer().currentRound!.pirateAbility!.id;

describe("optional pirate abilities", () => {
  it("maps powers to the pirate names printed on the existing artwork", () => {
    expect(Object.values(PIRATE_ABILITIES).map(({ kind }) => kind)).toEqual(["rosie", "rascal", "juanita", "bendt", "harry"]);
  });

  it("keeps abilities off by default and blocks using them when disabled", () => {
    const { game, alice } = pirateGame("pirate-1", false);
    expect(game.getStateForPlayer().pirateAbilities).toBe(false);
    expect(game.getStateForPlayer().currentRound!.pirateAbility).toBeNull();
    expect(() => game.usePirateAbility(alice, "old", { action: "decline" })).toThrow("disabled");
    expect(game.advanceFromTrickResult()).toBe(true);
  });

  it("pauses the result until its authenticated winner chooses, and ignores stale retries", () => {
    const { game, alice, bob } = pirateGame("pirate-1");
    const id = abilityId(game);
    expect(game.advanceFromTrickResult(game.getStateForPlayer().currentRound!.lastCompletedHand!.id)).toBe(false);
    expect(() => game.usePirateAbility("invalid", id, { action: "decline" })).toThrow("token");
    expect(() => game.usePirateAbility(bob, id, { action: "decline" })).toThrow("winning player");
    expect(() => game.usePirateAbility(alice, id, { action: "chooseLeader", playerId: "intruder" })).toThrow("player in this game");
    expect(abilityId(game)).toBe(id);
    expect(game.usePirateAbility(alice, id, { action: "chooseLeader", playerId: "Bob" })).toBe(true);
    expect(game.usePirateAbility(alice, id, { action: "chooseLeader", playerId: "Alice" })).toBe(false);
    game.advanceFromTrickResult();
    expect(game.getStateForPlayer().currentRound!.playerTurn).toBe("Bob");
  });

  it.each([0, 10, 20])("records a %i-point Rascal wager without changing the bid", (amount) => {
    const { game, alice } = pirateGame("pirate-2");
    game.usePirateAbility(alice, abilityId(game), { action: "wager", amount });
    expect(game.__debugDump().currentRound!.pirateWagers!.get("Alice")).toBe(amount);
    expect(game.getStateForPlayer(alice).currentRound!.myBid).toBe(1);
  });

  it("rejects invalid wagers and mismatched ability choices without consuming the power", () => {
    const { game, alice } = pirateGame("pirate-2");
    const id = abilityId(game);
    for (const amount of [-10, 5, 30, NaN]) {
      expect(() => game.usePirateAbility(alice, id, { action: "wager", amount })).toThrow("Wager");
    }
    expect(() => game.usePirateAbility(alice, id, { action: "draw" })).toThrow("not available");
    expect(() => game.usePirateAbility(alice, id, { action: "decline", amount: 20 })).toThrow("Unexpected");
    expect(game.usePirateAbility(alice, id, { action: "decline" })).toBe(true);
    expect(game.__debugDump().currentRound!.pirateWagers).toBeUndefined();
  });

  it("lets Juanita privately inspect undealt cards until she finishes", () => {
    const { game, deck, alice, bob } = pirateGame("pirate-3");
    const before = deck.getUndealtCards();
    const originalId = abilityId(game);
    expect(game.getStateForPlayer(alice).currentRound!.pirateAbility!.privateCards).toEqual([]);
    game.usePirateAbility(alice, originalId, { action: "reveal" });
    expect(game.getStateForPlayer(alice).currentRound!.pirateAbility!.privateCards).toEqual(before);
    for (const viewer of [undefined, bob, "invalid"]) {
      expect(game.getStateForPlayer(viewer).currentRound!.pirateAbility!.privateCards).toEqual([]);
    }
    expect(deck.getUndealtCards()).toEqual(before);
    expect(game.usePirateAbility(alice, originalId, { action: "reveal" })).toBe(false);
    const viewId = abilityId(game);
    expect(viewId).not.toBe(originalId);
    expect(game.advanceFromTrickResult()).toBe(false);
    game.usePirateAbility(alice, viewId, { action: "finish" });
    expect(game.getStateForPlayer(alice).currentRound!.pirateAbility).toBeNull();
  });

  it("draws Bendt's cards once, then requires two distinct owned discards", () => {
    const { game, deck, alice } = pirateGame("pirate-4");
    const id = abilityId(game);
    const handSize = game.getStateForPlayer(alice).me!.hand.length;
    const undealtSize = deck.getUndealtCards().length;
    game.usePirateAbility(alice, id, { action: "draw" });
    expect(game.usePirateAbility(alice, id, { action: "draw" })).toBe(false);
    expect(deck.getUndealtCards()).toHaveLength(undealtSize - 2);
    const hand = game.getStateForPlayer(alice).me!.hand;
    expect(hand).toHaveLength(handSize + 2);
    const discardId = abilityId(game);
    expect(() => game.usePirateAbility(alice, discardId, { action: "decline" })).toThrow("Finish");
    for (const cardIds of [[hand[0].id], [hand[0].id, hand[0].id], [hand[0].id, "escape-4"]]) {
      expect(() => game.usePirateAbility(alice, discardId, { action: "discard", cardIds })).toThrow();
    }
    expect(game.getStateForPlayer(alice).me!.hand).toHaveLength(handSize + 2);
    game.usePirateAbility(alice, discardId, { action: "discard", cardIds: [hand[0].id, hand[1].id] });
    expect(game.getStateForPlayer(alice).me!.hand).toEqual([hand[2]]);
    expect(game.usePirateAbility(alice, discardId, { action: "discard", cardIds: [hand[0].id, hand[1].id] })).toBe(false);
  });

  it("does not partially draw when a custom deck has fewer than two undealt cards", () => {
    const { game, deck, alice } = pirateGame("pirate-4");
    deck.__debugDeck().cardsInPlay.splice(1);
    const before = game.getStateForPlayer(alice).me!.hand.slice();
    expect(() => game.usePirateAbility(alice, abilityId(game), { action: "draw" })).toThrow("Not enough");
    expect(deck.getUndealtCards()).toHaveLength(1);
    expect(game.getStateForPlayer(alice).me!.hand).toEqual(before);
    game.usePirateAbility(alice, abilityId(game), { action: "decline" });
  });

  it.each([-1, 0, 1])("adjusts Harry's bid by %i", (amount) => {
    const { game, alice } = pirateGame("pirate-5");
    game.usePirateAbility(alice, abilityId(game), { action: "adjustBid", amount });
    expect(game.getStateForPlayer(alice).currentRound!.myBid).toBe(1 + amount);
  });

  it("allows Harry after the final trick, validates bid bounds, and scores the adjusted bid", () => {
    const { game, alice } = pirateGame("pirate-5", true, true);
    const id = abilityId(game);
    expect(() => game.usePirateAbility(alice, id, { action: "adjustBid", amount: -1 })).toThrow("fit the round");
    expect(() => game.usePirateAbility(alice, id, { action: "adjustBid", amount: 2 })).toThrow("-1, 0, or 1");
    game.usePirateAbility(alice, id, { action: "adjustBid", amount: 1 });
    game.advanceFromTrickResult();
    expect(game.getStateForPlayer().scorecard![0].find((score) => score.playerName === "Alice")!.tricksBid).toBe(1);
  });

  it.each(["pirate-1", "pirate-2", "pirate-3", "pirate-4"])("does not offer %s after the final trick", (id) => {
    const { game } = pirateGame(id, true, true);
    expect(game.getStateForPlayer().currentRound!.pirateAbility).toBeNull();
  });

  it("does not grant powers for captured pirates, Tigress, or discarded tricks", () => {
    const { game } = pirateGame("pirate-1");
    const round = game.__debugDump().currentRound!;
    for (const card of [{ id: "skullKing", type: "skullKing" as const }, { id: "tigress", type: "tigress" as const, selection: "pirate" as const }]) {
      round.lastCompletedHand!.winningCard!.card = card;
      expect(createPirateAbility(round)).toBeNull();
    }
    round.lastCompletedHand!.winningCard = null;
    expect(createPirateAbility(round)).toBeNull();
  });

  it.each(["kraken", "whiteWhale", "skullKing"] as const)("does not activate a pirate when %s negates or captures it in actual play", (type) => {
    const { game } = pirateGame("pirate-1", true, false, { id: type, type });
    const round = game.getStateForPlayer().currentRound!;
    expect(round.pirateAbility).toBeNull();
    if (type !== "skullKing") expect(round.lastCompletedHand!.winningCard).toBeNull();
    expect(game.advanceFromTrickResult()).toBe(true);
  });
});
