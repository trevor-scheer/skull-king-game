import { Deck } from "../deck";
import { Game } from "../game";

describe("Game", () => {
  let game: Game;
  beforeEach(() => {
    game = new Game();
  });

  describe("setup", () => {
    it("setup phase", () => {
      const phase = game.__debugDump().phase;
      expect(phase).toEqual("setup");
    });

    describe("errors", () => {
      it("requires enough players", () => {
        expect(() => game.start()).toThrowErrorMatchingInlineSnapshot(
          `"At least 2 players required to start the game"`
        );
        game.addPlayer("Seth");
        expect(() => game.start()).toThrowErrorMatchingInlineSnapshot(
          `"At least 2 players required to start the game"`
        );
      });
    });
  });

  describe("start", () => {
    it("enters play phase", () => {
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      expect(game.__debugDump().phase).toEqual("play");
    });

    it("initializes current round", () => {
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      expect(game.__debugDump().currentRound).toMatchObject(
        expect.objectContaining({
          roundNumber: 1,
          phase: "bid",
          cardsPlayed: expect.arrayContaining([]),
          dealer: 0,
        })
      );
    });

    describe("errors", () => {
      it("when start is called twice", () => {
        game.addPlayer("Seth");
        game.addPlayer("Trevor");
        game.start();
        expect(() => game.start()).toThrowErrorMatchingInlineSnapshot(
          `"Can't start an already started game"`
        );
      });

      it("when bid is placed before game is started", () => {
        game.addPlayer("Seth");
        game.addPlayer("Trevor");
        expect(() =>
          game.submitBid({ playerId: "Seth", count: 1 })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't submit bid during this game mode"`
        );
      });

      it("when card is played before game is started", () => {
        game.addPlayer("Seth");
        game.addPlayer("Trevor");
        expect(() =>
          game.playCard({ playerId: "Seth", card: { type: "skullKing" } })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't play a card during this game phase"`
        );
      });
    });
  });

  describe("bidding", () => {
    it("accepts a bid", () => {
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerId: "Seth", count: 1 });
      expect(game.__debugDump().currentRound.bids.get("Seth")).toEqual(1);
    });

    it("moves to play phase when all bids are entered", () => {
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerId: "Seth", count: 1 });
      game.submitBid({ playerId: "Trevor", count: 0 });

      const { currentRound } = game.__debugDump();
      expect(currentRound.bids.size).toEqual(2);
      expect(currentRound.phase).toEqual("play");
    });

    describe("errors", () => {
      it("when bid count exceeds cards in hand", () => {
        game.addPlayer("Seth");
        game.addPlayer("Trevor");
        game.start();
        expect(() =>
          game.submitBid({ playerId: "Seth", count: 2 })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't bid more than there are cards in the current hand"`
        );
      });

      it("when bid is submitted multiple times by the same person", () => {
        game.addPlayer("Seth");
        game.addPlayer("Trevor");
        game.start();
        game.submitBid({ playerId: "Seth", count: 1 });
        expect(() =>
          game.submitBid({ playerId: "Seth", count: 1 })
        ).toThrowErrorMatchingInlineSnapshot(`"Can't place multiple bids"`);
      });
    });
  });

  describe("playing cards", () => {
    beforeEach(() => {
      game = new Game({
        deck: new Deck({ shuffleSeed: 0.3 }),
      });
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerId: "Seth", count: 1 });
      game.submitBid({ playerId: "Trevor", count: 0 });
    });

    it("allows any card to be played when no trick color is set", () => {
      const { players } = game.__debugDump();
      const trevorCard = players[1].hand[0];
      expect(() =>
        game.playCard({ playerId: "Trevor", card: trevorCard })
      ).not.toThrow();
      const { currentRound } = game.__debugDump();
      expect(currentRound.trickColor).toEqual("green");
    });

    it("playing a special card does not set the trick color", () => {
      game = new Game({
        deck: new Deck({
          customDeck: [{ type: "pirate" }, { color: "green", number: 8 }],
          shuffleSeed: 0.4,
        }),
      });
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerId: "Seth", count: 1 });
      game.submitBid({ playerId: "Trevor", count: 0 });
      game.playCard({ playerId: "Trevor", card: { type: "pirate" } });
      expect(game.__debugDump().currentRound.trickColor).toEqual(null);
    });

    it.todo(
      "trick color is set to null for the round after a character card is led"
    );

    it("allows any special card to be played when the trick color is set", () => {
      game = new Game({
        deck: new Deck({
          customDeck: [
            { color: "green", number: 8 },
            { type: "pirate" },
            { type: "escape" },
            { type: "escape" },
          ],
          shuffleSeed: 0,
        }),
      });
      game.addPlayer("Seth");
      game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerId: "Seth", count: 1 });
      game.submitBid({ playerId: "Trevor", count: 0 });

      game.playCard({
        playerId: "Trevor",
        card: { color: "green", number: 8 },
      });
      expect(game.__debugDump().currentRound.trickColor).toEqual("green");

      expect(() =>
        game.playCard({ playerId: "Seth", card: { type: "pirate" } })
      ).not.toThrow();
    });
    it("allows playing a card whose color matches the trick color (requires multiple cards in hand to verify)", () => {
      // seth (has lead): pirate, purple 1
      // trevor: green 1, purple 2
      game = gameInSecondRound();
      game.playCard({
        playerId: "Seth",
        card: { color: "purple", number: 1 },
      });
      game.playCard({
        playerId: "Trevor",
        card: { color: "purple", number: 2 },
      });
    });
    it("allows playing a card of any color when no card in the hand matches the trick color (requires multiple cards in hand to verify)", () => {
      // seth: green 1, purple 2, black 1
      // trevor (has lead): pirate, purple 1, green 2
      const game = gameInThirdRound();
      game.playCard({
        playerId: "Trevor",
        card: { type: "pirate" },
      });
      game.playCard({
        playerId: "Seth",
        card: { color: "purple", number: 2 },
      });
      game.playCard({
        playerId: "Trevor",
        card: { color: "purple", number: 1 },
      });
      expect(() =>
        game.playCard({
          playerId: "Seth",
          card: { color: "green", number: 1 },
        })
      ).not.toThrow();
    });

    describe("errors", () => {
      it("disallows playing a card during the bid", () => {
        game = new Game();
        game.addPlayer("Seth");
        game.addPlayer("Trevor");
        game.start();
        expect(game.__debugDump().currentRound.phase).toEqual("bid");
        expect(() =>
          game.playCard({ playerId: "Seth", card: { type: "skullKing" } })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't play cards outside of play phase"`
        );
      });
      it("disallows playing out of turn", () => {
        expect(() =>
          game.playCard({
            playerId: "Seth",
            card: { color: "green", number: 8 },
          })
        ).toThrowErrorMatchingInlineSnapshot(`"Can't play out of turn"`);
      });
      it("disallows playing a card not in your hand", () => {
        expect(() =>
          game.playCard({
            playerId: "Trevor",
            card: { color: "purple", number: 8 },
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Programming error, card not found"`
        );
      });

      it("disallows playing a card not of the trick color when a card of the trick color is in hand (requires multiple cards in hand to verify)", () => {
        // seth (has lead): pirate, purple 1
        // trevor: green 1, purple 2
        game = gameInSecondRound();
        game.playCard({
          playerId: "Seth",
          card: { color: "purple", number: 1 },
        });

        expect(() =>
          game.playCard({
            playerId: "Trevor",
            card: { color: "green", number: 1 },
          })
        ).toThrowErrorMatchingInlineSnapshot(`"Illegal move"`);
      });
    });
  });
});

/**
 * @description
 * Returns a game with the state:
 * seth (has lead): pirate, purple 1
 * trevor: green 1, purple 2
 */
function gameInSecondRound() {
  const game = new Game({
    deck: new Deck({
      customDeck: [
        { type: "pirate" },
        { color: "green", number: 1 },
        { color: "green", number: 2 },
        { color: "black", number: 1 },
        { color: "purple", number: 1 },
        { color: "purple", number: 2 },
      ],
      shuffleSeed: 0,
    }),
  });

  game.addPlayer("Seth");
  game.addPlayer("Trevor");
  game.start();

  game.submitBid({ playerId: "Trevor", count: 1 });
  game.submitBid({ playerId: "Seth", count: 0 });

  game.playCard({ playerId: "Trevor", card: { type: "pirate" } });
  game.playCard({ playerId: "Seth", card: { color: "green", number: 1 } });

  game.submitBid({ playerId: "Trevor", count: 2 });
  game.submitBid({ playerId: "Seth", count: 0 });

  return game;
}

/**
 * @description
 * Returns a game with the state:
 * seth: green 1, purple 2, black 1
 * trevor (has lead): pirate, purple 1, green 2
 */
function gameInThirdRound() {
  const game = gameInSecondRound();
  game.playCard({ playerId: "Seth", card: { type: "pirate" } });
  game.playCard({ playerId: "Trevor", card: { color: "purple", number: 2 } });
  game.playCard({ playerId: "Seth", card: { color: "purple", number: 1 } });
  game.playCard({ playerId: "Trevor", card: { color: "green", number: 1 } });

  game.submitBid({ playerId: "Seth", count: 1 });
  game.submitBid({ playerId: "Trevor", count: 1 });

  return game;
}
