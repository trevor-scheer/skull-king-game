import { describe, it, expect, beforeEach } from "vitest";
import { Game } from "@skull-king/core";
import resolvers from "../resolvers";

describe("GraphQL Resolvers", () => {
  let context: { games: Map<string, Game> };

  beforeEach(() => {
    context = { games: new Map() };
  });

  describe("Query", () => {
    describe("games", () => {
      it("returns empty iterator when no games exist", () => {
        const result = resolvers.Query!.games!(null, {}, context, {} as any);
        expect([...result]).toEqual([]);
      });

      it("returns game IDs when games exist", () => {
        const game = new Game("test-id-1");
        context.games.set("test-id-1", game);

        const result = resolvers.Query!.games!(null, {}, context, {} as any);
        expect([...result]).toEqual(["test-id-1"]);
      });
    });

    describe("state", () => {
      it("returns undefined for non-existent game", () => {
        const result = resolvers.Query!.state!(
          null,
          { gameId: "non-existent" },
          context,
          {} as any
        );
        expect(result).toBeUndefined();
      });

      it("returns game state for existing game", () => {
        const game = new Game("test-id");
        game.addPlayer("Player1");
        context.games.set("test-id", game);

        const result = resolvers.Query!.state!(
          null,
          { gameId: "test-id" },
          context,
          {} as any
        );
        expect(result).toBeDefined();
        expect(result?.phase).toBe("setup");
        expect(result?.players).toHaveLength(1);
      });
    });
  });

  describe("Mutation", () => {
    describe("newGame", () => {
      it("creates a new game and returns its ID", () => {
        const result = resolvers.Mutation!.newGame!(
          null,
          {},
          context,
          {} as any
        );
        expect(result).toBeDefined();
        expect(typeof result).toBe("string");
        expect(context.games.has(result as string)).toBe(true);
      });

      it("creates game with deck configuration", () => {
        const result = resolvers.Mutation!.newGame!(
          null,
          { deckConfig: { includeMermaids: true } },
          context,
          {} as any
        );
        expect(result).toBeDefined();
        const game = context.games.get(result as string);
        expect(game).toBeDefined();
      });
    });

    describe("addPlayer", () => {
      it("adds a player to the game and returns token", () => {
        const gameId = resolvers.Mutation!.newGame!(
          null,
          {},
          context,
          {} as any
        ) as string;

        const token = resolvers.Mutation!.addPlayer!(
          null,
          { gameId, name: "TestPlayer" },
          context,
          {} as any
        );

        expect(token).toBeDefined();
        expect(typeof token).toBe("string");

        const state = context.games.get(gameId)?.getStateForPlayer();
        expect(state?.players).toHaveLength(1);
        expect(state?.players[0].name).toBe("TestPlayer");
      });

      it("throws error for non-existent game", () => {
        expect(() =>
          resolvers.Mutation!.addPlayer!(
            null,
            { gameId: "non-existent", name: "Player" },
            context,
            {} as any
          )
        ).toThrow("No game found with ID: non-existent");
      });
    });

    describe("startGame", () => {
      it("starts a game with enough players", () => {
        const gameId = resolvers.Mutation!.newGame!(
          null,
          {},
          context,
          {} as any
        ) as string;

        resolvers.Mutation!.addPlayer!(
          null,
          { gameId, name: "Player1" },
          context,
          {} as any
        );
        resolvers.Mutation!.addPlayer!(
          null,
          { gameId, name: "Player2" },
          context,
          {} as any
        );

        const result = resolvers.Mutation!.startGame!(
          null,
          { gameId },
          context,
          {} as any
        );

        expect(result).toBe(true);
        expect(context.games.get(gameId)?.getStateForPlayer().phase).toBe(
          "play"
        );
      });
    });

    describe("submitBid", () => {
      it("submits a bid for a player", () => {
        const gameId = resolvers.Mutation!.newGame!(
          null,
          {},
          context,
          {} as any
        ) as string;

        const token1 = resolvers.Mutation!.addPlayer!(
          null,
          { gameId, name: "Player1" },
          context,
          {} as any
        ) as string;
        resolvers.Mutation!.addPlayer!(
          null,
          { gameId, name: "Player2" },
          context,
          {} as any
        );

        resolvers.Mutation!.startGame!(null, { gameId }, context, {} as any);

        const result = resolvers.Mutation!.submitBid!(
          null,
          { gameId, playerToken: token1, count: 1 },
          context,
          {} as any
        );

        expect(result).toBe(true);
      });
    });
  });

  describe("Card type resolver", () => {
    it("resolves colored card type", () => {
      const coloredCard = { id: "test", color: "GREEN", number: 5 };
      const result = resolvers.Card!.__resolveType!(coloredCard, {}, {} as any, {} as any);
      expect(result).toBe("ColoredCard");
    });

    it("resolves special card type", () => {
      const specialCard = { id: "test", type: "pirate" };
      const result = resolvers.Card!.__resolveType!(specialCard, {}, {} as any, {} as any);
      expect(result).toBe("SpecialCard");
    });
  });
});
