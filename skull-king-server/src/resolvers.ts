import { Game, Card, isSpecialCard, DeckConfiguration } from "@skull-king/core";
import { randomUUID } from "crypto";
import { Context } from ".";
import { getGameChannel, pubsub } from "./pubsub";

// Publish state update to all connected clients for a game
function broadcastGameState(gameId: string, games: Map<string, Game>) {
  const game = games.get(gameId);
  if (!game) return;

  const channel = getGameChannel(gameId);
  // Publish game ID - subscribers will resolve their own state
  pubsub.publish(channel, { gameId });
}

const resolvers = {
  Query: {
    players(_: unknown, { gameId }: { gameId: string }, { games }: Context) {
      const game = games.get(gameId);
      return JSON.stringify(game?.getStateForPlayer().players, null, 2);
    },
    games(_: unknown, __: unknown, { games }: Context) {
      return games.keys();
    },
    state(_: unknown, { gameId, playerToken }: { gameId: string; playerToken?: string }, { games }: Context) {
      const game = games.get(gameId);
      return game?.getStateForPlayer(playerToken);
    },
  },
  Mutation: {
    newGame(_: unknown, { deckConfig }: { deckConfig?: DeckConfiguration }, context: Context) {
      const id = randomUUID();
      const game = new Game(id, { deckConfig });
      game.onGameEnd(() => {
        setTimeout(() => context.games.delete(id), 1000 * 60 * 10);
      });
      context.games.set(id, game);
      return id;
    },
    startGame(_: unknown, { gameId }: { gameId: string }, { games }: Context) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.start();
      broadcastGameState(gameId, games);
      return true;
    },
    addPlayer(_: unknown, { gameId, name }: { gameId: string; name: string }, { games }: Context) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      const token = game.addPlayer(name);
      broadcastGameState(gameId, games);
      return token;
    },
    submitBid(_: unknown, { gameId, playerToken, count }: { gameId: string; playerToken: string; count: number }, { games }: Context) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.submitBid({ playerToken, count });
      broadcastGameState(gameId, games);
      return true;
    },
    playColoredCard(_: unknown, { gameId, playerToken, cardId }: { gameId: string; playerToken: string; cardId: string }, { games }: Context) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.playCard({ playerToken, cardId });
      broadcastGameState(gameId, games);
      return true;
    },
    playSpecialCard(_: unknown, { gameId, playerToken, cardId, selection }: { gameId: string; playerToken: string; cardId: string; selection?: string }, { games }: Context) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.playCard({ playerToken, cardId, selection });
      broadcastGameState(gameId, games);
      return true;
    },
    advanceTrick(_: unknown, { gameId }: { gameId: string }, { games }: Context) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.advanceFromTrickResult();
      broadcastGameState(gameId, games);
      return true;
    },
  },
  Subscription: {
    state: {
      subscribe(_: unknown, { gameId }: { gameId: string }) {
        const channel = getGameChannel(gameId);
        return pubsub.asyncIterator([channel]);
      },
      resolve(payload: { gameId: string }, { gameId, playerToken }: { gameId: string; playerToken?: string }, { games }: Context) {
        // Get fresh state for the specific player
        const game = games.get(gameId);
        return game?.getStateForPlayer(playerToken);
      },
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
