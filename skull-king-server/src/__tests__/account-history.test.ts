import { Accounts } from '../accounts';
import { Rooms } from '../rooms';
import { observeAccountHistory } from '../accountHistory';
import { Game } from '../../../skull-king-core/src/game';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('records a server-timed final trick once and backfills durable finished rooms on restart', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'sk-history-'));
  let now = Date.now();
  let accounts = new Accounts(join(directory, 'accounts.sqlite'), () => now);
  let rooms = new Rooms(join(directory, 'rooms'), () => now);
  let stop = observeAccountHistory(accounts, rooms);
  try {
    const { account } = await accounts.signup('alice', 'a long passphrase');
    const game = new Game('match', { roundSchedule: [1] });
    const alice = game.addPlayer('Alice'); const bob = game.addPlayer('Bob');
    accounts.bindSeat(account, 'match', game, alice);
    rooms.games.set('match', game); game.start();
    const debug = game.__debugDump();
    debug.players.forEach((player,index) => { player.hand = [debug.deck.getCard(['yellow-3','yellow-1','yellow-2'][index])!]; });
    game.submitBid({ playerToken: alice, count: 1 }); game.submitBid({ playerToken: bob, count: 0 });
    game.playCard({ playerToken: bob, cardId: 'yellow-1' }); game.playCard({ playerToken: alice, cardId: 'yellow-3' });
    rooms.save('match');
    expect(accounts.history(account)).toEqual([]);
    rooms.tick(); now += 5001; rooms.tick();
    expect(game.getStateForPlayer().phase).toBe('postgame');
    expect(accounts.history(account)).toHaveLength(1);
    expect(accounts.resumeSeat(account, 'match', game)).toBe(alice);
    expect(accounts.linkedGames(account, rooms.games)).toEqual([expect.objectContaining({gameId:'match', phase:'postgame'})]);
    expect(accounts.leaderboard()[0]).toMatchObject({ username: 'alice', wins: 1, games: 1 });
    rooms.save('match'); expect(accounts.history(account)).toHaveLength(1);
    stop(); accounts.close();
    accounts = new Accounts(join(directory, 'accounts.sqlite'), () => now);
    rooms = new Rooms(join(directory, 'rooms'), () => now);
    stop = observeAccountHistory(accounts, rooms);
    expect(accounts.history(account)).toHaveLength(1);
    expect(accounts.leaderboard()[0].games).toBe(1);
    // A checkpoint saved before the observer was attached is replayed too.
    stop();
    const restored = Game.restoreCheckpoint(game.checkpoint());
    rooms.games.set('unobserved', restored); rooms.save('unobserved');
    stop = observeAccountHistory(accounts, rooms);
    expect(accounts.history(account)).toHaveLength(1); // unrelated room has no linked account
  } finally { stop(); accounts.close(); rmSync(directory, { recursive: true, force: true }); }
});
