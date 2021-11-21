import { randomUUID } from "crypto";
import { Deck } from "../deck";
import { Game } from "../game";

describe("Game", () => {
  let game: Game;
  beforeEach(() => {
    game = new Game(randomUUID());
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
        const sethToken = game.addPlayer("Seth");
        const trevorToken = game.addPlayer("Trevor");
        expect(() =>
          game.submitBid({ playerToken: sethToken, count: 1 })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't submit bid during this game mode"`
        );
      });

      it("when card is played before game is started", () => {
        const sethToken = game.addPlayer("Seth");
        const trevorToken = game.addPlayer("Trevor");
        const randomCard = game.__debugDump().deck.draw();
        expect(() =>
          game.playCard({ playerToken: sethToken, cardId: randomCard.id })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't play a card during this game phase"`
        );
      });
    });
  });

  describe("bidding", () => {
    it("accepts a bid", () => {
      const sethToken = game.addPlayer("Seth");
      const trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      expect(game.__debugDump().currentRound.bids.get("Seth")).toEqual(1);
    });

    it("moves to play phase when all bids are entered", () => {
      const sethToken = game.addPlayer("Seth");
      const trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      game.submitBid({ playerToken: trevorToken, count: 0 });

      const { currentRound } = game.__debugDump();
      expect(currentRound.bids.size).toEqual(2);
      expect(currentRound.phase).toEqual("play");
    });

    describe("errors", () => {
      it("when bid count exceeds cards in hand", () => {
        const sethToken = game.addPlayer("Seth");
        const trevorToken = game.addPlayer("Trevor");
        game.start();
        expect(() =>
          game.submitBid({ playerToken: sethToken, count: 2 })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't bid more than there are cards in the current hand"`
        );
      });

      it("when bid is submitted multiple times by the same person", () => {
        const sethToken = game.addPlayer("Seth");
        const trevorToken = game.addPlayer("Trevor");
        game.start();
        game.submitBid({ playerToken: sethToken, count: 1 });
        expect(() =>
          game.submitBid({ playerToken: sethToken, count: 1 })
        ).toThrowErrorMatchingInlineSnapshot(`"Can't place multiple bids"`);
      });
    });
  });

  describe("playing cards", () => {
    let sethToken: string;
    let trevorToken: string;
    beforeEach(() => {
      game = new Game(randomUUID(), {
        deck: new Deck({ shuffleSeed: 0.3 }),
      });
      sethToken = game.addPlayer("Seth");
      trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      game.submitBid({ playerToken: trevorToken, count: 0 });
    });

    it("allows any card to be played when no trick color is set", () => {
      const { players } = game.__debugDump();
      const trevorCard = players[1].hand[0];
      expect(() =>
        game.playCard({ playerToken: trevorToken, cardId: trevorCard.id })
      ).not.toThrow();
      const { currentRound } = game.__debugDump();
      expect(currentRound.trickColor).toEqual("GREEN");
    });

    it("playing a special card does not set the trick color", () => {
      game = new Game(randomUUID(), {
        deck: new Deck({
          customDeck: [
            { id: "1", type: "pirate" },
            { id: "2", color: "GREEN", number: 8 },
          ],
          shuffleSeed: 0.4,
        }),
      });
      const sethToken = game.addPlayer("Seth");
      const trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      game.submitBid({ playerToken: trevorToken, count: 0 });
      // pirate
      game.playCard({ playerToken: trevorToken, cardId: "1" });
      expect(game.__debugDump().currentRound.trickColor).toEqual(null);
    });

    it("resets the trick color after a hand", () => {
      const { players } = game.__debugDump();
      const trevorCard = players[1].hand[0];
      const sethCard = players[0].hand[0];
      game.playCard({ playerToken: trevorToken, cardId: trevorCard.id });
      let trickColor = game.__debugDump().currentRound.trickColor;
      expect(trickColor).toEqual("GREEN");
      game.playCard({ playerToken: sethToken, cardId: sethCard.id });
      trickColor = game.__debugDump().currentRound.trickColor;
      expect(trickColor).toEqual(null);
    });

    it.todo(
      "trick color is set to null for the round after a character card is led"
    );

    it("allows any special card to be played when the trick color is set", () => {
      game = new Game(randomUUID(), {
        deck: new Deck({
          customDeck: [
            { id: "1", color: "GREEN", number: 8 },
            { id: "2", type: "pirate" },
            { id: "3", type: "escape" },
            { id: "4", type: "escape" },
          ],
          shuffleSeed: 0,
        }),
      });
      sethToken = game.addPlayer("Seth");
      trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      game.submitBid({ playerToken: trevorToken, count: 0 });

      game.playCard({
        playerToken: trevorToken,
        // GREEN 8
        cardId: "1",
      });
      expect(game.__debugDump().currentRound.trickColor).toEqual("GREEN");

      expect(() =>
        // pirate
        game.playCard({ playerToken: sethToken, cardId: "2" })
      ).not.toThrow();
    });
    it("allows playing a card whose color matches the trick color (requires multiple cards in hand to verify)", () => {
      // seth (has lead): pirate, purple 1
      // trevor: green 1, purple 2
      ({ game, trevorToken, sethToken } = gameInSecondRound());
      game.playCard({
        playerToken: sethToken,
        // PURPLE 1
        cardId: "5",
      });
      game.playCard({
        playerToken: trevorToken,
        // PURPLE 2
        cardId: "6",
      });
    });
    it("allows playing a card of any color when no card in the hand matches the trick color (requires multiple cards in hand to verify)", () => {
      // seth: green 1, purple 2, black 1
      // trevor (has lead): pirate, purple 1, green 2
      ({ game, sethToken, trevorToken } = gameInThirdRound());
      game.playCard({
        playerToken: trevorToken,
        // pirate
        cardId: "1",
      });
      game.playCard({
        playerToken: sethToken,
        // PURPLE 2
        cardId: "6",
      });
      game.playCard({
        playerToken: trevorToken,
        // PURPLE 1
        cardId: "5",
      });
      expect(() =>
        game.playCard({
          playerToken: sethToken,
          // GREEN 1
          cardId: "2",
        })
      ).not.toThrow();
    });

    describe("errors", () => {
      it("disallows playing a card during the bid", () => {
        game = new Game(randomUUID());
        const sethToken = game.addPlayer("Seth");
        const trevorToken = game.addPlayer("Trevor");
        game.start();
        const randomCard = game.__debugDump().deck.draw();
        expect(game.__debugDump().currentRound.phase).toEqual("bid");
        expect(() =>
          game.playCard({ playerToken: sethToken, cardId: randomCard.id })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't play cards outside of play phase"`
        );
      });
      it("disallows playing out of turn", () => {
        const sethCard = game.__debugDump().players[0].hand[0];
        expect(() =>
          game.playCard({
            playerToken: sethToken,
            cardId: sethCard.id,
          })
        ).toThrowErrorMatchingInlineSnapshot(`"Can't play out of turn"`);
      });
      it("disallows playing a card not in your hand", () => {
        const sethCardId = game.__debugDump().players[0].hand[0].id;
        expect(() =>
          game.playCard({
            playerToken: trevorToken,
            cardId: sethCardId,
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Card not found in player's hand"`
        );
      });

      it("disallows playing a card not of the trick color when a card of the trick color is in hand (requires multiple cards in hand to verify)", () => {
        // seth (has lead): pirate, purple 1
        // trevor: green 1, purple 2
        ({ game, trevorToken, sethToken } = gameInSecondRound());

        game.playCard({
          playerToken: sethToken,
          // PURPLE 1
          cardId: "5",
        });

        expect(() =>
          game.playCard({
            playerToken: trevorToken,
            // GREEN 1
            cardId: "2",
          })
        ).toThrowErrorMatchingInlineSnapshot(`"Illegal move"`);
      });

      it("disallows playing a tigress without a selection", () => {
        const game = new Game(randomUUID(), {
          deck: new Deck({
            customDeck: [
              { id: "1", type: "tigress" },
              { id: "2", type: "tigress" },
            ],
            shuffleSeed: 0,
          }),
        });

        const sethToken = game.addPlayer("Seth");
        const trevorToken = game.addPlayer("Trevor");
        game.start();

        game.submitBid({ playerToken: trevorToken, count: 1 });
        game.submitBid({ playerToken: sethToken, count: 0 });

        expect(() =>
          game.playCard({
            playerToken: trevorToken,
            // tigress
            cardId: "1",
          })
        ).toThrowErrorMatchingInlineSnapshot(
          `"Can't play tigress card without providing a selection"`
        );
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
  const game = new Game(randomUUID(), {
    deck: new Deck({
      customDeck: [
        { id: "1", type: "pirate" },
        { id: "2", color: "GREEN", number: 1 },
        { id: "3", color: "GREEN", number: 2 },
        { id: "4", color: "BLACK", number: 1 },
        { id: "5", color: "PURPLE", number: 1 },
        { id: "6", color: "PURPLE", number: 2 },
      ],
      shuffleSeed: 0,
    }),
  });

  const sethToken = game.addPlayer("Seth");
  const trevorToken = game.addPlayer("Trevor");
  game.start();

  game.submitBid({ playerToken: trevorToken, count: 1 });
  game.submitBid({ playerToken: sethToken, count: 0 });

  game.playCard({
    playerToken: trevorToken,
    // pirate
    cardId: "1",
  });
  // GREEN 1
  game.playCard({ playerToken: sethToken, cardId: "2" });
  game.submitBid({ playerToken: trevorToken, count: 2 });
  game.submitBid({ playerToken: sethToken, count: 0 });

  return { game, trevorToken, sethToken };
}

/**
 * @description
 * Returns a game with the state:
 * seth: green 1, purple 2, black 1
 * trevor (has lead): pirate, purple 1, green 2
 */
function gameInThirdRound() {
  const { game, trevorToken, sethToken } = gameInSecondRound();
  // pirate
  game.playCard({ playerToken: sethToken, cardId: "1" });
  // PURPLE 2
  game.playCard({ playerToken: trevorToken, cardId: "6" });
  // PURPLE 1
  game.playCard({ playerToken: sethToken, cardId: "5" });
  // GREEN 1
  game.playCard({ playerToken: trevorToken, cardId: "2" });

  game.submitBid({ playerToken: sethToken, count: 1 });
  game.submitBid({ playerToken: trevorToken, count: 1 });

  return { game, trevorToken, sethToken };
}
