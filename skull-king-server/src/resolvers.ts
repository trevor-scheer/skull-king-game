import { Config } from "apollo-server";
import { Game } from "@skull-king/core";

const resolvers: Config["resolvers"] = {
  Query: {
    players(_, { gameId }, { games }) {
      const game: Game = games.get(gameId);
      return JSON.stringify(game.__debugDump().players, null, 2);
    },
  },
  Mutation: {
    newGame(_, __, context) {
      const game = new Game();
      const id = context.games.size;
      context.games.set(id, game);
      return id;
    },
    startGame(_, { gameId }, { games, pubsub }) {
      const game: Game = games.get(gameId);
      game.start();
      pubsub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    addPlayer(_, { gameId, name }, { games, pubsub }) {
      const game: Game = games.get(gameId);
      game.addPlayer(name);
      pubsub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    submitBid(_, { gameId, playerId, count }, { games, pubsub }) {
      const game: Game = games.get(gameId);
      game.submitBid({ playerId, count });
      pubsub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    playColoredCard(_, { gameId, playerId, color, number }, { games, pubsub }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerId, card: { color, number } });
      pubsub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    playSpecialCard(
      _,
      { gameId, playerId, card, selection },
      { games, pubsub }
    ) {
      const game: Game = games.get(gameId);
      game.playCard({ playerId, card: { type: card, selection } });
      pubsub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
  },
};

export default resolvers;
