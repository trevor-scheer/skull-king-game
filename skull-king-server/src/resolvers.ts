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
      if (game && typeof playerToken === "string") game.recordPresence(playerToken);
      return game?.getStateForPlayer(playerToken);
    },
  },
  Mutation: {
    newGame(_, { deckConfig, scoringMode, pirateAbilities, roundSchedule, tieBreakers, cannonball }: { deckConfig?: DeckConfiguration; scoringMode?: ScoringMode; pirateAbilities?: boolean; roundSchedule?: number[]; tieBreakers?: boolean; cannonball?: boolean }, context) {
      const id = randomUUID();
      const game = new Game(id, { deckConfig, scoringMode, pirateAbilities, roundSchedule, tieBreakers, cannonball, bidRevealDurationMs: 4500 });
      context.games.set(id, game);
      return id;
    },
    rematchGame(_, { gameId, playerToken }, context) {
      const game = context.games.get(gameId);
      assertGame(game, gameId);
      const state = requirePlayer(game, playerToken);
      if (state.nextGameId) return state.nextGameId;
      const id = randomUUID();
      context.games.set(id, game.createRematch(id));
      return id;
    },
    startGame(_, { gameId, playerToken }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      requireHost(game, playerToken);
      game.start();
      return true;
    },
    addBot(_, { gameId, playerToken }, { games }) {
      const game = games.get(gameId); assertGame(game, gameId);
      return game.addBot(playerToken);
    },
    removeBot(_, { gameId, playerToken, playerId }, { games }) {
      const game = games.get(gameId); assertGame(game, gameId);
      return game.removeBot(playerToken, playerId);
    },
    setAutoplay(_, { gameId, playerToken, enabled }, { games }) {
      const game = games.get(gameId); assertGame(game, gameId);
      return game.setAutoplay(playerToken, enabled);
    },
    enableAwayAutoplay(_, { gameId, playerToken, playerId, expectedLastSeenAt }, { games }) {
      const game = games.get(gameId); assertGame(game, gameId);
      return game.enableAwayAutoplay(playerToken, playerId, expectedLastSeenAt);
    },
    leaveGame(_, { gameId, playerToken }, { games }) {
      const game = games.get(gameId); assertGame(game, gameId);
      return game.leaveGame(playerToken);
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
    loadCannon(_, { gameId, playerToken, load, expectedRoundNumber }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      return game.loadCannon({ playerToken, load, expectedRoundNumber });
    },
    playColoredCard(_, { gameId, playerToken, cardId, numberChoice, colorChoice }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.playCard({ playerToken, cardId, numberChoice, colorChoice });
      return true;
    },
    playSpecialCard(_, { gameId, playerToken, cardId, selection }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      game.playCard({ playerToken, cardId, selection });
      return true;
    },
    choosePlankTarget(_, { gameId, playerToken, expectedChoiceId, cardId }, { games }) {
      const game = games.get(gameId);
      assertGame(game, gameId);
      return game.choosePlankTarget(playerToken, expectedChoiceId, cardId);
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

// Persist at the action boundary, including mutations that use literal GraphQL arguments.
const mutations = resolvers!.Mutation as Record<string, (parent: unknown, args: any, context: Context, info: any) => unknown>;
for (const [name, resolve] of Object.entries(mutations)) {
  mutations[name] = (parent, args, context, info) => {
    const action = () => resolve(parent, args, context, info);
    return context.rooms ? context.rooms.mutate(typeof args.gameId === "string" ? args.gameId : undefined, action) : action();
  };
}

function assertGame(game: Game | undefined, gameId?: string): asserts game {
  if (!game) {
    throw Error(`No game found with ID: ${gameId}`);
  }
}

export default resolvers;
