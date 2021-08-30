import type { Config } from "apollo-server-express";
import { Game, Card, isSpecialCard } from "@skull-king/core";
import { PubSub } from "graphql-subscriptions";
import { randomUUID } from "crypto";

interface Context {
  games: Map<string, Game>;
}
const resolvers: (pubSub: PubSub) => Config["resolvers"] = (pubSub) => ({
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
      pubSub.publish(`GAME_UPDATED_${gameId}`, {
        state: game.getStateForPlayer(),
      });
      return true;
    },
    addPlayer(_, { gameId, name }, { games }) {
      const game: Game = games.get(gameId);
      const token = game.addPlayer(name);

      pubSub.publish(`GAME_UPDATED_${gameId}`, {
        state: game.getStateForPlayer(),
      });

      return token;
    },
    submitBid(_, { gameId, playerToken, count }, { games }) {
      const game: Game = games.get(gameId);
      game.submitBid({ playerToken, count });
      pubSub.publish(`GAME_UPDATED_${gameId}`, {
        state: game.getStateForPlayer(playerToken),
      });
      return true;
    },
    playColoredCard(_, { gameId, playerToken, color, number }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerToken, card: { color, number } });
      pubSub.publish(`GAME_UPDATED_${gameId}`, {
        state: game.getStateForPlayer(playerToken),
      });
      return true;
    },
    playSpecialCard(_, { gameId, playerToken, card, selection }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerToken, card: { type: card, selection } });
      pubSub.publish(`GAME_UPDATED_${gameId}`, {
        state: game.getStateForPlayer(playerToken),
      });
      return true;
    },
  },
  Subscription: {
    hello: {
      subscribe: async function* () {
        yield { hello: "Hello World!" };
      },
    },
    state: {
      subscribe(_, { gameId, playerToken }) {
        console.log(gameId, playerToken);
        const asyncIterator = pubSub.asyncIterator(`GAME_UPDATED_${gameId}`);
        return asyncIterator;
      },
    },
  },
  Card: {
    __resolveType(card: Card) {
      return isSpecialCard(card) ? "SpecialCard" : "ColoredCard";
    },
  },
});

export default resolvers;
