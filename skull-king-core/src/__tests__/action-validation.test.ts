import { Card } from "../cards";
import { Deck } from "../deck";
import { Game } from "../game";

function startGame(customDeck?: Card[]) {
  const game = new Game("actions", {
    deck: new Deck({ customDeck, shuffleSeed: 0.5 }),
  });
  const tokens = new Map([
    ["Alice", game.addPlayer("Alice")],
    ["Bob", game.addPlayer("Bob")],
  ]);
  game.start();
  return { game, tokens };
}

function finishBidding(game: Game, tokens: Map<string, string>) {
  for (const playerToken of tokens.values()) {
    game.submitBid({ playerToken, count: 0 });
  }
}

function expectUnchangedAfterRejection(game: Game, action: () => void) {
  const snapshot = () =>
    JSON.stringify(game.__debugDump(), (_key, value) =>
      value instanceof Map || value instanceof Set ? [...value] : value,
    );
  const before = snapshot();
  expect(action).toThrow();
  expect(snapshot()).toBe(before);
}

describe("authoritative action validation", () => {
  it.each(["", " ", "\t\n"])("rejects blank name %j", (name) => {
    const game = new Game("names");
    expectUnchangedAfterRejection(game, () => game.addPlayer(name));
    expect(game.addPlayer("Alice")).toEqual(expect.any(String));
  });

  it("preserves a valid name exactly", () => {
    const game = new Game("names");
    const token = game.addPlayer(" Alice ");
    expect(game.getStateForPlayer(token).me?.name).toBe(" Alice ");
  });

  it("rejects joining after the game starts", () => {
    const { game, tokens } = startGame();
    expectUnchangedAfterRejection(game, () => game.addPlayer("Charlie"));
    finishBidding(game, tokens);
    expect(game.__debugDump().currentRound.phase).toBe("play");
  });

  it("rejects joining after the game ends", () => {
    const customDeck: Card[] = Array.from({ length: 20 }, (_, index) => ({
      id: `escape-${index}`,
      type: "escape",
    }));
    const { game, tokens } = startGame(customDeck);
    for (let round = 1; round <= 10; round++) {
      finishBidding(game, tokens);
      for (let trick = 0; trick < round; trick++) {
        for (let player = 0; player < tokens.size; player++) {
          const playerTurn = game.getStateForPlayer().currentRound!.playerTurn;
          const playerToken = tokens.get(playerTurn)!;
          const card = game.getStateForPlayer(playerToken).me!.hand[0];
          game.playCard({ playerToken, cardId: card.id });
        }
        game.advanceFromTrickResult();
      }
    }
    expect(game.getStateForPlayer().phase).toBe("postgame");
    expectUnchangedAfterRejection(game, () => game.addPlayer("Charlie"));
  });

  it.each([-1, 0.5, NaN, Infinity, -Infinity])(
    "rejects invalid bid %s without recording it",
    (count) => {
      const { game, tokens } = startGame();
      const playerToken = tokens.get("Alice")!;
      expectUnchangedAfterRejection(game, () =>
        game.submitBid({ playerToken, count }),
      );
      game.submitBid({ playerToken, count: 0 });
      expect(game.getStateForPlayer(playerToken).currentRound!.myBid).toBe(0);
    },
  );

  it("rejects another player's special-card ID even when holding the same type", () => {
    const { game, tokens } = startGame([
      { id: "pirate-1", type: "pirate" },
      { id: "pirate-2", type: "pirate" },
    ]);
    finishBidding(game, tokens);
    const turn = game.getStateForPlayer().currentRound!.playerTurn;
    const playerToken = tokens.get(turn)!;
    const otherToken = [...tokens.entries()].find(
      ([name]) => name !== turn,
    )![1];
    const ownedCard = game.getStateForPlayer(playerToken).me!.hand[0];
    const otherCard = game.getStateForPlayer(otherToken).me!.hand[0];
    expectUnchangedAfterRejection(game, () =>
      game.playCard({ playerToken, cardId: otherCard.id }),
    );
    game.playCard({ playerToken, cardId: ownedCard.id });
    expect(game.getStateForPlayer(playerToken).me!.hand).toHaveLength(0);
    expect(game.__debugDump().currentRound.cardsPlayed[0].card.id).toBe(
      ownedCard.id,
    );
  });

  it.each([undefined, null, "", "skullKing"])(
    "rejects invalid Tigress choice %j without consuming the card",
    (selection) => {
      const { game, tokens } = startGame([
        { id: "tigress-1", type: "tigress" },
        { id: "tigress-2", type: "tigress" },
      ]);
      finishBidding(game, tokens);
      const turn = game.getStateForPlayer().currentRound!.playerTurn;
      const playerToken = tokens.get(turn)!;
      const card = game.getStateForPlayer(playerToken).me!.hand[0];
      expectUnchangedAfterRejection(game, () =>
        game.playCard({
          playerToken,
          cardId: card.id,
          selection: selection as "pirate",
        }),
      );
      game.playCard({ playerToken, cardId: card.id, selection: "escape" });
      expect(game.__debugDump().currentRound.cardsPlayed[0].card).toMatchObject(
        {
          id: card.id,
          selection: "escape",
        },
      );
    },
  );

  it.each(["pirate", "escape"] as const)(
    "accepts Tigress as %s",
    (selection) => {
      const { game, tokens } = startGame([
        { id: "tigress-1", type: "tigress" },
        { id: "tigress-2", type: "tigress" },
      ]);
      finishBidding(game, tokens);
      const turn = game.getStateForPlayer().currentRound!.playerTurn;
      const playerToken = tokens.get(turn)!;
      const card = game.getStateForPlayer(playerToken).me!.hand[0];
      game.playCard({ playerToken, cardId: card.id, selection });
      expect(game.__debugDump().currentRound.cardsPlayed[0].card).toMatchObject(
        { selection },
      );
    },
  );

  it("rejects Tigress choices on other cards", () => {
    const { game, tokens } = startGame([
      { id: "escape-1", type: "escape" },
      { id: "escape-2", type: "escape" },
    ]);
    finishBidding(game, tokens);
    const turn = game.getStateForPlayer().currentRound!.playerTurn;
    const playerToken = tokens.get(turn)!;
    const card = game.getStateForPlayer(playerToken).me!.hand[0];
    expectUnchangedAfterRejection(game, () =>
      game.playCard({ playerToken, cardId: card.id, selection: "pirate" }),
    );
    game.playCard({ playerToken, cardId: card.id });
    expect(game.getStateForPlayer(playerToken).me!.hand).toHaveLength(0);
  });
});
