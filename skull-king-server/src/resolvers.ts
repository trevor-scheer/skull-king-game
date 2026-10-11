import type { ApolloServerOptions } from "@apollo/server";
import { Game, Card, isSpecialCard, DeckConfiguration, ScoringMode } from "@skull-king/core";
import { randomUUID } from "crypto";
import type { Context } from "./context";
import { requireHost, requirePlayer } from "./permissions";

const resolvers: ApolloServerOptions<Context>["resolvers"] = {
  Query: {
    players(_, { gameId }, { games }: Context) {
      const game = games.get(gameId);
      return JSON.stringify(game?.getStateForPlayer().players, null, 2);
    },
    games(_, __, { games }: Context) {
      return games.keys();
    },
    state(_, { gameId, playerToken }, { games }: Context) {
      const game = games.get(gameId);
      return game?.getStateForPlayer(playerToken);
    },
  },
  Mutation: {
    newGame(_, { deckConfig, scoringMode, pirateAbilities }: { deckConfig?: DeckConfiguration; scoringMode?: ScoringMode; pirateAbilities?: boolean }, context) {
      const id = randomUUID();
      const game = new Game(id, { deckConfig, scoringMode, pirateAbilities });
      context.games.set(id, game);
      return id;
    },
    startGame(_, { gameId, playerToken }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      requireHost(game, playerToken);
      game.start();
      return true;
    },
    addPlayer(_, { gameId, name }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      const token = game.addPlayer(name);
      return token;
    },
    submitBid(_, { gameId, playerToken, count }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.submitBid({ playerToken, count });
      return true;
    },
    playColoredCard(_, { gameId, playerToken, cardId }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.playCard({ playerToken, cardId });
      return true;
    },
    playSpecialCard(_, { gameId, playerToken, cardId, selection }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.playCard({ playerToken, cardId, selection });
      return true;
    },
    advanceTrick(_, { gameId, playerToken, expectedHandId }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      requirePlayer(game, playerToken);
      return game.advanceFromTrickResult(expectedHandId);
    },
    usePirateAbility(_, { gameId, playerToken, expectedAbilityId, input }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      return game.usePirateAbility(playerToken, expectedAbilityId, input);
    },
  },
  Card: {
    __resolveType(card: Card) {
      return isSpecialCard(card) ? "SpecialCard" : "ColoredCard";
    },
  },
};

function assertGame(game: Game | undefined, gameId?: string): asserts game {
  if (!game) {
    throw Error(`No game found with ID: ${gameId}`);
  }
}

export default resolvers;
