import type { Config } from "apollo-server";
import { Game, Card, isSpecialCard } from "@skull-king/core";
import { randomUUID } from "crypto";

interface Context {
  games: Map<string, Game>;
}
const resolvers: Config["resolvers"] = {
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
      context.games.set(id, game);
      return id;
    },
    startGame(_, { gameId }, { games }) {
      const game: Game = games.get(gameId);
      game.start();
      return true;
    },
    addPlayer(_, { gameId, name }, { games }) {
      const game: Game = games.get(gameId);
      const token = game.addPlayer(name);
      return token;
    },
    submitBid(_, { gameId, playerToken, count }, { games }) {
      const game: Game = games.get(gameId);
      game.submitBid({ playerToken, count });
      return true;
    },
    playColoredCard(_, { gameId, playerToken, cardId }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerToken, cardId });
      return true;
    },
    playSpecialCard(_, { gameId, playerToken, cardId, selection }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerToken, cardId, selection });
      return true;
    },
  },
  Card: {
    __resolveType(card: Card) {
      return isSpecialCard(card) ? "SpecialCard" : "ColoredCard";
    },
  },
};

export default resolvers;
