import { PubSub } from "graphql-subscriptions";

export const pubsub = new PubSub();

export const GAME_STATE_UPDATED = "GAME_STATE_UPDATED";

export function getGameChannel(gameId: string) {
  return `${GAME_STATE_UPDATED}.${gameId}`;
}
