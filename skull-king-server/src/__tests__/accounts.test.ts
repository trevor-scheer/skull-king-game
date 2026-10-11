import { Accounts } from '../accounts';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Game } from '../../../skull-king-core/src/game';

let accounts: Accounts;
let directory: string;
let now: number;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'sk-accounts-')); now = Date.now(); accounts = new Accounts(join(directory, 'accounts.sqlite'), () => now); });
afterEach(() => { accounts.close(); rmSync(directory, { recursive: true, force: true }); });
const password = 'a long unique passphrase';

it('stores salted hashes, persists sessions across restart, expires and revokes them', async () => {
  const first = await accounts.signup('Alice', password); const second = await accounts.signup('Bob', password);
  expect(first.account.username).toBe('alice');
  await expect(accounts.login('ALICE', password)).resolves.toEqual(first.account);
  await expect(accounts.login('alice', 'wrong')).rejects.toThrow('not recognized');
  await expect(accounts.login('missing', 'wrong')).rejects.toThrow('not recognized');
  await expect(accounts.signup('ALICE', password)).rejects.toThrow('unavailable');
  const session = accounts.issueSession(first.account);
  accounts.close(); accounts = new Accounts(join(directory, 'accounts.sqlite'), () => now);
  expect(accounts.session(session.token)).toEqual(first.account);
  const bytes = readFileSync(join(directory, 'accounts.sqlite')).toString();
  expect(bytes).not.toContain(password); expect(bytes).not.toContain(first.recoveryCode); expect(bytes).not.toContain(session.token);
  accounts.revoke(session.token); expect(accounts.session(session.token)).toBeNull();
  const expired = accounts.issueSession(second.account); now += 31 * 86400_000;
  expect(accounts.session(expired.token)).toBeNull();
});

it('uses recovery codes once and invalidates every older session and password', async () => {
  const created = await accounts.signup('alice', password); const old = accounts.issueSession(created.account);
  const reset = await accounts.recover('alice', created.recoveryCode, 'a different secret');
  expect(accounts.session(old.token)).toBeNull();
  await expect(accounts.login('alice', password)).rejects.toThrow();
  await expect(accounts.login('alice', 'a different secret')).resolves.toEqual(created.account);
  await expect(accounts.recover('alice', created.recoveryCode, password)).rejects.toThrow();
  expect(reset.recoveryCode).not.toBe(created.recoveryCode);
  const nextSession = accounts.issueSession(created.account);
  const changedCode = await accounts.changePassword(created.account, 'a different secret', 'another secret phrase');
  expect(accounts.session(nextSession.token)).toBeNull();
  await expect(accounts.recover('alice', reset.recoveryCode, password)).rejects.toThrow();
  await expect(accounts.recover('alice', changedCode, password)).resolves.toBeDefined();
});

it('links only a proved seat and never returns another account’s seat token', async () => {
  const { account: alice } = await accounts.signup('alice', password); const { account: bob } = await accounts.signup('bob', password);
  const game = new Game('room'); const token = game.addPlayer('a display name'); const other = game.addPlayer('another name');
  expect(() => accounts.bindSeat(alice, 'room', game, 'a display name')).toThrow('does not own');
  accounts.bindSeat(alice, 'room', game, token);
  expect(() => accounts.bindSeat(bob, 'room', game, token)).toThrow('already linked');
  expect(() => accounts.bindSeat(alice, 'room', game, other)).toThrow('already has');
  expect(() => accounts.resumeSeat(bob, 'room', game)).toThrow('No linked seat');
  expect(accounts.resumeSeat(alice, 'room', game)).toBe(token);
  expect(JSON.stringify(accounts.linkedGames(alice, new Map([['room', game]])))).not.toContain(token);
  const exported = JSON.stringify(accounts.exportAccount(alice)); expect(exported).not.toContain(token); expect(exported).not.toContain(password);
});

function finished(id: string, practice = false) {
  const game = new Game(id, { roundSchedule: [1], twoPlayerMode: 'duel' });
  const aliceToken = game.addPlayer('Alice'); const bobToken = game.addPlayer('Bob');
  const result = [{ playerName: 'Alice', totalPoints: 20 }, { playerName: 'Bob', totalPoints: -10 }];
  const complete = () => jest.spyOn(game, 'getStateForPlayer').mockReturnValue({ ...game.getStateForPlayer(), phase: 'postgame', scorecard: [result], practice } as any);
  return { game, aliceToken, bobToken, complete };
}
it('records once across repeated checkpoints/restarts, excludes practice, and erases personal history', async () => {
  const { account: alice } = await accounts.signup('alice', password); const { account: bob } = await accounts.signup('bob', password);
  const match = finished('room'); accounts.bindSeat(alice, 'room', match.game, match.aliceToken); accounts.bindSeat(bob, 'room', match.game, match.bobToken); match.complete();
  accounts.recordCompleted('room', match.game); accounts.recordCompleted('room', match.game);
  accounts.close(); accounts = new Accounts(join(directory, 'accounts.sqlite'), () => now); accounts.recordCompleted('room', match.game);
  expect(accounts.history(alice)).toHaveLength(1);
  expect(accounts.leaderboard()).toEqual(expect.arrayContaining([expect.objectContaining({ username: 'alice', games: 1, wins: 1 }), expect.objectContaining({ username: 'bob', games: 1, wins: 0 })]));
  const practice = finished('practice', true); accounts.bindSeat(alice, 'practice', practice.game, practice.aliceToken); practice.complete(); accounts.recordCompleted('practice', practice.game);
  expect(accounts.history(alice)).toHaveLength(2); expect(accounts.leaderboard().find(row => row.username === 'alice')!.games).toBe(1);
  const session = accounts.issueSession(alice);
  await expect(accounts.deleteAccount(alice, 'wrong')).rejects.toThrow();
  await accounts.deleteAccount(alice, password);
  expect(accounts.session(session.token)).toBeNull(); expect(accounts.history(alice)).toEqual([]);
  expect(accounts.leaderboard().map(row => row.username)).toEqual(['bob']);
});
