import type { ApolloServerOptions } from "@apollo/server";
import { Game, Card, isSpecialCard } from "@skull-king/core";
import { randomUUID } from "crypto";
import { Context } from ".";

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
    newGame(_, __, context) {
      const id = randomUUID();
      const game = new Game(id);
      game.onGameEnd(() => {
        setTimeout(() => context.games.delete(id), 1000 * 60 * 10);
      });
      context.games.set(id, game);
      return id;
    },
    startGame(_, { gameId }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
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
    advanceTrick(_, { gameId }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.advanceFromTrickResult();
      return true;
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
