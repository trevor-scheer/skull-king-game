import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { chmodSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Game } from '@skull-king/core';

export class AccountError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
export type Account = { id: string; username: string };
type Credentials = Account & { password: string; recovery: string };
const SESSION_DURATION = 30 * 86400_000;
const secret = () => randomBytes(32).toString('base64url');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const safeEqual = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
function checkPassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 128) throw new AccountError('Use a password with 10–128 characters (at most 128 bytes).');
}
function normalizedName(username: unknown) {
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_-]{3,24}$/.test(username)) throw new AccountError('Use 3–24 letters, numbers, underscores, or hyphens for your username.');
  return username.toLowerCase();
}
async function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const key = await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
  return `${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password: unknown, stored?: string) {
  if (typeof password !== 'string' || Buffer.byteLength(password) > 128) return false;
  // The same expensive operation runs for unknown usernames.
  const salt = stored?.split(':')[0] ?? '00000000000000000000000000000000';
  return safeEqual(await hashPassword(password, salt), stored ?? '');
}

/** One process owns the SQLite connection; no account credential leaves this boundary. */
export class Accounts {
  private db: DatabaseSync;
  constructor(path: string, private now = Date.now) {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    if (path !== ':memory:') chmodSync(path, 0o600);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, recovery TEXT NOT NULL, created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS seats(game_id TEXT NOT NULL, player_id TEXT NOT NULL, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, token TEXT NOT NULL, PRIMARY KEY(game_id,player_id), UNIQUE(game_id,user_id));
      CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY, finished INTEGER NOT NULL, scoring TEXT NOT NULL, schedule TEXT NOT NULL, eligible INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS results(game_id TEXT NOT NULL REFERENCES matches(id), player_id TEXT NOT NULL, user_id TEXT REFERENCES users(id) ON DELETE SET NULL, points INTEGER NOT NULL, won INTEGER NOT NULL, PRIMARY KEY(game_id,player_id));
      CREATE INDEX IF NOT EXISTS results_user ON results(user_id);
      CREATE INDEX IF NOT EXISTS seats_user ON seats(user_id);
    `);
  }
  close() { this.db.close(); }
  private credentials(username: string) { return this.db.prepare('SELECT id,username,password,recovery FROM users WHERE username=?').get(username) as Credentials | undefined; }
  private transaction<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = work(); this.db.exec('COMMIT'); return result; } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async signup(username: unknown, password: unknown) {
    const name = normalizedName(username); checkPassword(password);
    const hashed = await hashPassword(password);
    const recoveryCode = secret();
    const account = { id: randomUUID(), username: name };
    try { this.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(account.id, name, hashed, digest(recoveryCode), this.now()); }
    catch (error) { if (this.credentials(name)) throw new AccountError('That username is unavailable.', 409); throw error; }
    return { account, recoveryCode };
  }
  async login(username: unknown, password: unknown): Promise<Account> {
    const user = typeof username === 'string' ? this.credentials(username.toLowerCase()) : undefined;
    if (!await verifyPassword(password, user?.password) || !user) throw new AccountError('Username or password was not recognized.', 401);
    // A concurrent password reset must invalidate an in-flight login too.
    if (this.credentials(user.username)?.password !== user.password) throw new AccountError('Please sign in again.', 401);
    return { id: user.id, username: user.username };
  }
  issueSession(account: Account) {
    const token = secret(); const expires = this.now() + SESSION_DURATION;
    this.db.prepare('DELETE FROM sessions WHERE expires<=?').run(this.now());
    this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(digest(token), account.id, expires);
    return { token, expires };
  }
  session(token?: string): Account | null {
    if (!token || token.length > 128) return null;
    return this.db.prepare('SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(digest(token), this.now()) as Account | undefined ?? null;
  }
  revoke(token?: string) { if (token) this.db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token)); }
  revokeAll(id: string) { this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(id); }
  async recover(username: unknown, recoveryCode: unknown, password: unknown) {
    const name = normalizedName(username); checkPassword(password);
    const user = this.credentials(name);
    if (typeof recoveryCode !== 'string' || recoveryCode.length > 128 || !user || !safeEqual(digest(recoveryCode), user.recovery)) throw new AccountError('Username or recovery code was not recognized.', 401);
    const hashed = await hashPassword(password); const nextCode = secret();
    this.transaction(() => {
      const changed = this.db.prepare('UPDATE users SET password=?,recovery=? WHERE id=? AND recovery=?').run(hashed, digest(nextCode), user.id, user.recovery);
      if (!changed.changes) throw new AccountError('That recovery code has already been used.', 401);
      this.revokeAll(user.id);
    });
    return { account: { id: user.id, username: user.username }, recoveryCode: nextCode };
  }
  async changePassword(account: Account, current: unknown, password: unknown) {
    const user = this.credentials(account.username);
    if (!user || !await verifyPassword(current, user.password)) throw new AccountError('Current password was not recognized.', 401);
    checkPassword(password);
    const hashed = await hashPassword(password); const recoveryCode = secret();
    this.transaction(() => {
      if (!this.db.prepare('UPDATE users SET password=?,recovery=? WHERE id=? AND password=?').run(hashed, digest(recoveryCode), user.id, user.password).changes) throw new AccountError('Credentials changed. Please sign in again.', 401);
      this.revokeAll(account.id);
    });
    return recoveryCode;
  }
  async deleteAccount(account: Account, password: unknown) {
    const user = this.credentials(account.username);
    if (!user || !await verifyPassword(password, user.password)) throw new AccountError('Password was not recognized.', 401);
    this.transaction(() => {
      if (this.credentials(account.username)?.password !== user.password) throw new AccountError('Credentials changed. Please sign in again.', 401);
      this.db.prepare('DELETE FROM results WHERE user_id=?').run(account.id);
      this.db.prepare('DELETE FROM users WHERE id=?').run(account.id);
    });
  }
  bindSeat(account: Account, gameId: string, game: Game, token: string) {
    const state = game.getStateForPlayer(token);
    if (!state.me || state.me.isAutomated) throw new AccountError('This device does not own that seat.', 403);
    if (state.phase === 'postgame') throw new AccountError('Link your seat before the match finishes.');
    const owner = this.db.prepare('SELECT user_id FROM seats WHERE game_id=? AND player_id=?').get(gameId, state.me.id);
    if (owner && owner.user_id !== account.id) throw new AccountError('That seat is already linked to an account.', 409);
    const ownSeat = this.db.prepare('SELECT player_id FROM seats WHERE game_id=? AND user_id=?').get(gameId, account.id);
    if (ownSeat && ownSeat.player_id !== state.me.id) throw new AccountError('Your account already has a seat in this game.', 409);
    this.db.prepare('INSERT INTO seats VALUES(?,?,?,?) ON CONFLICT(game_id,player_id) DO UPDATE SET token=excluded.token').run(gameId, state.me.id, account.id, token);
  }
  resumeSeat(account: Account, gameId: string, game: Game) {
    const seat = this.db.prepare('SELECT token FROM seats WHERE game_id=? AND user_id=?').get(gameId, account.id);
    if (!seat || typeof seat.token !== 'string' || !game.getStateForPlayer(seat.token).me) throw new AccountError('No linked seat is available in this game.', 404);
    return seat.token;
  }
  linkedGames(account: Account, games: Map<string, Game>) {
    return this.db.prepare('SELECT game_id,player_id FROM seats WHERE user_id=?').all(account.id).flatMap((seat) => {
      const gameId = String(seat.game_id); const state = games.get(gameId)?.getStateForPlayer();
      return state && state.phase !== 'postgame' ? [{ gameId, playerName: String(seat.player_id), phase: state.phase }] : [];
    });
  }
  recordCompleted(gameId: string, game: Game) {
    const state = game.getStateForPlayer();
    if (state.phase !== 'postgame' || !state.scorecard?.length) return;
    const results = state.scorecard[state.scorecard.length - 1];
    const highest = Math.max(...results.map(result => result.totalPoints));
    const hasPractice = Boolean((state as typeof state & { practice?: boolean }).practice) || state.players.some(player => Boolean((player as typeof player & { isBot?: boolean }).isBot));
    const eligible = !hasPractice && results.length >= 2;
    this.transaction(() => {
      if (!this.db.prepare('INSERT OR IGNORE INTO matches VALUES(?,?,?,?,?)').run(gameId, this.now(), state.scoringMode, JSON.stringify(state.roundSchedule), Number(eligible)).changes) return;
      for (const result of results) {
        const owner = this.db.prepare('SELECT user_id FROM seats WHERE game_id=? AND player_id=?').get(gameId, result.playerName);
        this.db.prepare('INSERT INTO results VALUES(?,?,?,?,?)').run(gameId, result.playerName, owner?.user_id ?? null, result.totalPoints, Number(result.totalPoints === highest));
      }
      // Finished room credentials are no longer needed for cross-device play.
      this.db.prepare('DELETE FROM seats WHERE game_id=?').run(gameId);
    });
  }
  history(account: Account, all = false) {
    return this.db.prepare(`SELECT matches.id AS gameId,finished,scoring,schedule,eligible,points,won FROM results JOIN matches ON matches.id=results.game_id WHERE user_id=? ORDER BY finished DESC ${all ? "" : "LIMIT 200"}`).all(account.id);
  }
  leaderboard() {
    return this.db.prepare(`SELECT users.username,COUNT(*) AS games,SUM(results.won) AS wins,ROUND(100.0*SUM(results.won)/COUNT(*),1) AS winRate FROM results JOIN users ON users.id=results.user_id JOIN matches ON matches.id=results.game_id WHERE matches.eligible=1 GROUP BY users.id ORDER BY wins DESC,games DESC,users.username LIMIT 100`).all();
  }
  exportAccount(account: Account) {
    return { account, history: this.history(account, true), linkedSeats: this.db.prepare('SELECT game_id AS gameId,player_id AS playerName FROM seats WHERE user_id=?').all(account.id) };
  }
}
