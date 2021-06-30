import type { Config } from "apollo-server-express";
import { Game } from "@skull-king/core";
import { PubSub } from "graphql-subscriptions";

const resolvers: (pubSub: PubSub) => Config["resolvers"] = (pubSub) => ({
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
      pubSub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    addPlayer(_, { gameId, name }, { games }) {
      const game: Game = games.get(gameId);
      game.addPlayer(name);
      pubSub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    submitBid(_, { gameId, playerId, count }, { games }) {
      const game: Game = games.get(gameId);
      game.submitBid({ playerId, count });
      pubSub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    playColoredCard(_, { gameId, playerId, color, number }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerId, card: { color, number } });
      pubSub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
      return true;
    },
    playSpecialCard(_, { gameId, playerId, card, selection }, { games }) {
      const game: Game = games.get(gameId);
      game.playCard({ playerId, card: { type: card, selection } });
      pubSub.publish(`GAME_UPDATED_${gameId}`, { state: game.__debugDump() });
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
      subscribe(_, { id }) {
        console.log(id);
        const asyncIterator = pubSub.asyncIterator(`GAME_UPDATED_${id}`);
        console.log(asyncIterator);
        return asyncIterator;
      },
    },
    // state: (args: any, { pubsub }: any) => {
    //   console.log(args);
    //   return pubsub.asyncIterator(`GAME_UPDATED_${args.id}`);
    //   // console.log({ args, context });
    //   // console.log(context.games);
    //   // const game = context.games.get(args.id);
    //   // const { phase, players, currentRound } = game.__debugDump();
    //   // console.log({ phase, players, currentRound });
    //   // yield { state: { phase, players, currentRound } };
    // },
  },
});

export default resolvers;
