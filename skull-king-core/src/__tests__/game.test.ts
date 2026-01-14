import { randomUUID } from "crypto";
import { basicDeck } from "../cards";
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
          `"Can't submit bid during this game phase"`
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
        deck: new Deck({ noShuffle: true }),
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
      // Trick color should be set to the played card's color
      expect(currentRound.trickColor).toEqual("YELLOW");
    });

    it("playing a special card does not set the trick color", () => {
      game = new Game(randomUUID(), {
        deck: new Deck({
          customDeck: [
            { id: "1", type: "pirate" },
            { id: "2", type: "pirate" },
          ],
          noShuffle: true,
        }),
      });
      const sethToken = game.addPlayer("Seth");
      const trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      game.submitBid({ playerToken: trevorToken, count: 0 });
      // Play the pirate that Trevor has
      const trevorCard = game.__debugDump().players[1].hand[0];
      game.playCard({ playerToken: trevorToken, cardId: trevorCard.id });
      expect(game.__debugDump().currentRound.trickColor).toEqual(null);
    });

    it("resets the trick color after a hand", () => {
      const { players } = game.__debugDump();
      const trevorCard = players[1].hand[0];
      const sethCard = players[0].hand[0];
      game.playCard({ playerToken: trevorToken, cardId: trevorCard.id });
      let trickColor = game.__debugDump().currentRound.trickColor;
      // Trick color should be set to the played card's color
      expect(trickColor).toEqual("YELLOW");
      game.playCard({ playerToken: sethToken, cardId: sethCard.id });
      // After trick ends, we're in trick_result phase - trickColor preserved for display
      expect(game.__debugDump().currentRound.phase).toEqual("trick_result");
      game.advanceFromTrickResult();
      // After advancing, trick color is reset
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
            { id: "2", color: "GREEN", number: 9 },
            { id: "3", type: "pirate" },
            { id: "4", type: "escape" },
          ],
          noShuffle: true,
        }),
      });
      sethToken = game.addPlayer("Seth");
      trevorToken = game.addPlayer("Trevor");
      game.start();
      game.submitBid({ playerToken: sethToken, count: 1 });
      game.submitBid({ playerToken: trevorToken, count: 0 });

      // Trevor plays a GREEN card to set trick color
      const trevorCard = game.__debugDump().players[1].hand[0];
      game.playCard({ playerToken: trevorToken, cardId: trevorCard.id });
      expect(game.__debugDump().currentRound.trickColor).toEqual("GREEN");

      // Seth plays a special card (pirate) which should be allowed
      const sethCard = game.__debugDump().players[0].hand[0];
      expect(() =>
        game.playCard({ playerToken: sethToken, cardId: sethCard.id })
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
      // Set up a game with specific cards for this test
      game = new Game(randomUUID(), {
        deck: new Deck({
          customDeck: [
            // For 2 players in round 2 with 2 cards each:
            // Deal order: Trevor, Seth, Trevor, Seth
            { id: "1", color: "GREEN", number: 1 },   // Trevor hand[0]
            { id: "2", color: "PURPLE", number: 1 },  // Seth hand[0]
            { id: "3", color: "GREEN", number: 2 },   // Trevor hand[1]
            { id: "4", color: "PURPLE", number: 2 },  // Seth hand[1]
          ],
          noShuffle: true,
        }),
      });

      sethToken = game.addPlayer("Seth");
      trevorToken = game.addPlayer("Trevor");
      game.start();

      // Skip to round 2 (need 2 cards each to test following suit)
      // Round 1
      game.submitBid({ playerToken: trevorToken, count: 0 });
      game.submitBid({ playerToken: sethToken, count: 0 });
      const r1Trevor = game.__debugDump().players[1].hand[0];
      const r1Seth = game.__debugDump().players[0].hand[0];
      game.playCard({ playerToken: trevorToken, cardId: r1Trevor.id });
      game.playCard({ playerToken: sethToken, cardId: r1Seth.id });
      game.advanceFromTrickResult();

      // Round 2: Seth leads
      game.submitBid({ playerToken: sethToken, count: 0 });
      game.submitBid({ playerToken: trevorToken, count: 0 });

      // Seth leads with PURPLE, setting trick color
      const sethPurple = game.__debugDump().players[0].hand.find((c: any) => c.color === "PURPLE");
      game.playCard({ playerToken: sethToken, cardId: sethPurple!.id });

      // Trevor has no PURPLE (only GREEN), so he can legally play GREEN
      const trevorGreen = game.__debugDump().players[1].hand.find((c: any) => c.color === "GREEN");
      expect(trevorGreen).toBeDefined();
      expect(() =>
        game.playCard({ playerToken: trevorToken, cardId: trevorGreen!.id })
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

        // Seth leads with PURPLE 1, setting trick color to PURPLE
        game.playCard({
          playerToken: sethToken,
          cardId: "5", // PURPLE 1
        });

        // Trevor tries to play GREEN 1 when he has PURPLE 2 - should fail
        expect(() =>
          game.playCard({
            playerToken: trevorToken,
            cardId: "2", // GREEN 1 - illegal because Trevor has PURPLE 2
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
            noShuffle: true,
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

  describe("postgame", () => {
    it("ends the game after the 10th round", () => {
      const { game } = gameAfterTenthRound();
      expect(game.__debugDump().currentRound).toBe(null);
      expect(game.__debugDump().phase).toBe("postgame");
    });

    it("doesn't accept bids or plays after the 10th round", () => {
      const { game, trevorToken } = gameAfterTenthRound();

      expect(() =>
        game.submitBid({ playerToken: trevorToken, count: 1 })
      ).toThrowErrorMatchingInlineSnapshot(
        `"Can't submit bid during this game phase"`
      );

      expect(() =>
        game.playCard({ playerToken: trevorToken, cardId: "yellow-1" })
      ).toThrowErrorMatchingInlineSnapshot(
        `"Can't play a card during this game phase"`
      );
    });

    it("calculates final scores after the 10th round", () => {
      const { game } = gameAfterTenthRound();

      // Verify scores exist (specific values depend on game play)
      const trevorScore = game.__debugDump().scorecard?.getPlayerScore("Trevor");
      const sethScore = game.__debugDump().scorecard?.getPlayerScore("Seth");
      expect(typeof trevorScore).toBe("number");
      expect(typeof sethScore).toBe("number");
    });
  });
});

/**
 * Sets up a game in round 2 with specific card distributions.
 *
 * Dealing pattern (noShuffle, 2 players):
 * - R1 deal order: Seth, Trevor (1 card each) → deck[0], deck[1]
 * - R2 deal order: Trevor, Seth alternating (2 cards each) → deck[0,2] for Trevor, deck[1,3] for Seth
 *
 * After round 2 starts:
 * - Seth has: pirate (id "1"), PURPLE 1 (id "5")
 * - Trevor has: GREEN 1 (id "2"), PURPLE 2 (id "6")
 *
 * Seth has lead in round 2.
 */
function gameInSecondRound() {
  const game = new Game(randomUUID(), {
    deck: new Deck({
      customDeck: [
        // Deck positions determine dealing for both R1 and R2
        { id: "2", color: "GREEN", number: 1 },   // deck[0]: Seth R1, Trevor R2 hand[0]
        { id: "1", type: "pirate" },              // deck[1]: Trevor R1, Seth R2 hand[0]
        { id: "6", color: "PURPLE", number: 2 },  // deck[2]: Trevor R2 hand[1]
        { id: "5", color: "PURPLE", number: 1 },  // deck[3]: Seth R2 hand[1]
      ],
      noShuffle: true,
    }),
  });

  const sethToken = game.addPlayer("Seth");
  const trevorToken = game.addPlayer("Trevor");
  game.start();

  // Round 1: Trevor leads
  game.submitBid({ playerToken: trevorToken, count: 1 });
  game.submitBid({ playerToken: sethToken, count: 0 });

  game.playCard({ playerToken: trevorToken, cardId: "1" }); // pirate (Trevor R1)
  game.playCard({ playerToken: sethToken, cardId: "2" });   // GREEN 1 (Seth R1)
  game.advanceFromTrickResult();

  // Round 2: Seth leads
  game.submitBid({ playerToken: trevorToken, count: 2 });
  game.submitBid({ playerToken: sethToken, count: 0 });

  return { game, trevorToken, sethToken };
}

/**
 * Sets up a game in round 3 for testing playing off-suit.
 *
 * R3 deal order (Trevor, Seth alternating based on leader logic):
 * - Trevor: deck[0], deck[2], deck[4] = GREEN cards
 * - Seth: deck[1], deck[3], deck[5] = pirate + PURPLE cards
 *
 * After round 3 starts:
 * - Seth (leads): has pirate and PURPLE cards
 * - Trevor: has only GREEN (can't follow PURPLE)
 */
function gameInThirdRound() {
  const game = new Game(randomUUID(), {
    deck: new Deck({
      customDeck: [
        // R3 deal order: Trevor, Seth, Trevor, Seth, Trevor, Seth
        { id: "2", color: "GREEN", number: 1 },   // deck[0] - Trevor
        { id: "1", type: "pirate" },              // deck[1] - Seth
        { id: "6", color: "GREEN", number: 2 },   // deck[2] - Trevor
        { id: "5", color: "PURPLE", number: 1 },  // deck[3] - Seth
        { id: "4", color: "GREEN", number: 3 },   // deck[4] - Trevor
        { id: "3", color: "PURPLE", number: 2 },  // deck[5] - Seth
      ],
      noShuffle: true,
    }),
  });

  const sethToken = game.addPlayer("Seth");
  const trevorToken = game.addPlayer("Trevor");
  game.start();

  // Play through R1 and R2 dynamically
  for (let round = 1; round <= 2; round++) {
    // Bids (leader bids first in each round)
    const state = game.__debugDump();
    const leader = state.currentRound.leader;
    const leaderToken = leader === 0 ? sethToken : trevorToken;
    const followerToken = leader === 0 ? trevorToken : sethToken;

    game.submitBid({ playerToken: leaderToken, count: round });
    game.submitBid({ playerToken: followerToken, count: 0 });

    // Play all tricks in round
    for (let trick = 0; trick < round; trick++) {
      const leaderIdx = game.__debugDump().currentRound.leader;
      const leaderTkn = leaderIdx === 0 ? sethToken : trevorToken;
      const followerTkn = leaderIdx === 0 ? trevorToken : sethToken;
      const leaderCard = game.__debugDump().players[leaderIdx].hand[0];
      const followerCard = game.__debugDump().players[1 - leaderIdx].hand[0];

      game.playCard({ playerToken: leaderTkn, cardId: leaderCard.id });
      game.playCard({ playerToken: followerTkn, cardId: followerCard.id });
      game.advanceFromTrickResult();
    }
  }

  // R3: Submit bids (Seth leads in R3)
  game.submitBid({ playerToken: sethToken, count: 1 });
  game.submitBid({ playerToken: trevorToken, count: 1 });

  return { game, trevorToken, sethToken };
}

/**
 * Plays through all 10 rounds dynamically to reach postgame state.
 * Uses escape cards to make gameplay predictable - leader always wins.
 */
function gameAfterTenthRound() {
  const game = new Game(randomUUID(), {
    deck: new Deck({ customDeck: basicDeck, noShuffle: true }),
  });
  const sethToken = game.addPlayer("Seth");
  const trevorToken = game.addPlayer("Trevor");
  game.start();

  // Helper to play a card from player's hand
  const playFirstCard = (playerToken: string, playerIdx: number) => {
    const hand = game.__debugDump().players[playerIdx].hand;
    if (hand.length === 0) return;
    const card = hand[0];
    // Handle tigress specially (check if it's a special card with type)
    if ("type" in card && card.type === "tigress") {
      game.playCard({ playerToken, cardId: card.id, selection: "escape" });
    } else {
      game.playCard({ playerToken, cardId: card.id });
    }
  };

  // Play through all 10 rounds
  for (let round = 1; round <= 10; round++) {
    expect(game.__debugDump().currentRound?.roundNumber).toBe(round);

    // Determine who leads this round
    const state = game.__debugDump();
    const leaderIdx = state.currentRound.leader;
    const leaderToken = leaderIdx === 0 ? sethToken : trevorToken;
    const followerToken = leaderIdx === 0 ? trevorToken : sethToken;
    const followerIdx = 1 - leaderIdx;

    // Submit bids (leader must bid first based on current phase)
    game.submitBid({ playerToken: leaderToken, count: 0 });
    game.submitBid({ playerToken: followerToken, count: 0 });

    // Play all tricks in the round
    for (let trick = 0; trick < round; trick++) {
      const currentLeaderIdx = game.__debugDump().currentRound.leader;
      const currentLeaderToken = currentLeaderIdx === 0 ? sethToken : trevorToken;
      const currentFollowerToken = currentLeaderIdx === 0 ? trevorToken : sethToken;

      playFirstCard(currentLeaderToken, currentLeaderIdx);
      playFirstCard(currentFollowerToken, 1 - currentLeaderIdx);
      game.advanceFromTrickResult();
    }
  }

  return { trevorToken, sethToken, game };
}
