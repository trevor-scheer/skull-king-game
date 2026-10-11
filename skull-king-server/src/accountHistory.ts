import type { Game } from '@skull-king/core';
import type { Accounts } from './accounts';
import type { Rooms } from './rooms';

/** Checkpoints are the recovery source; INSERT OR IGNORE makes replay safe. */
export function observeAccountHistory(accounts: Accounts, rooms: Rooms) {
  const record = (id: string, game: Game) => accounts.recordCompleted(id, game);
  rooms.saved.on('saved', record);
  for (const [id, game] of rooms.games) record(id, game);
  return () => rooms.saved.off('saved', record);
}
