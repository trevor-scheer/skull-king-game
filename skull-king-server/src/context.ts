import type { Game } from '@skull-king/core';
import type { Rooms } from './rooms';
export interface Context {
  games: Map<string, Game>;
  rooms?: Rooms;
}
