import { Game } from '@skull-king/core';
export function requirePlayer(game: Game, token?: string) {
  const state = game.getStateForPlayer(token);
  if (!token || !state.me) throw new Error('Join this game to take that action.');
  return state;
}
export function requireHost(game: Game, token?: string) {
  const state = requirePlayer(game, token);
  if (state.me!.id !== state.players.find(player => !player.isBot && !player.isAutomated)?.id) throw new Error('Only the host can do that.');
  return state;
}
