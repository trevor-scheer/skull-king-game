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
    startGame(_, { gameId }, { games }) {
      const game: Game = games.get(gameId);
      game.start();
      console.log(game.__debugDump());
      return true;
    },
    addPlayer(_, { gameId, name }, { games }) {
      const game: Game = games.get(gameId);
      game.addPlayer(name);
      console.log(game.__debugDump().players);
      return true;
    },
    submitBid(_, { gameId, playerId, count }, { games }) {
      const game: Game = games.get(gameId);
      game.submitBid({ playerId, count });
      return true;
    },
    playColoredCard(_, { gameId, playerId, color, number }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerId, card: { color, number } });
      return true;
    },
    playSpecialCard(_, { gameId, playerId, card, selection }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerId, card: { type: card, selection } });
      return true;
    },
  },
};

export default resolvers;
