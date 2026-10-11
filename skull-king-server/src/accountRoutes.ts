import { Router, Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Account, AccountError, Accounts } from './accounts';
import type { Rooms } from './rooms';

const SESSION_COOKIE = 'sk_session';
const CSRF_COOKIE = 'sk_csrf';
function cookies(req: Request): Record<string, string> {
  return Object.fromEntries((req.headers.cookie ?? '').split(';').flatMap(part => {
    const index = part.indexOf('='); return index < 0 ? [] : [[part.slice(0, index).trim(), part.slice(index + 1)]];
  }));
}
export function accountRoutes(accounts: Accounts, rooms: Rooms, origins: string[], now = Date.now) {
  const router = Router();
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' as const, path: '/api/account' };
  const limits = new Map<string, { count: number; until: number }>();
  function limit(key: string, max: number) {
    const timestamp = now();
    const entry = limits.get(key);
    const bucket = entry && entry.until > timestamp ? entry : { count: 0, until: timestamp + 15 * 60_000 };
    limits.set(key, bucket);
    if (limits.size > 10000) for (const [name, entry] of limits) if (entry.until <= timestamp) limits.delete(name);
    if (++bucket.count > max) throw new AccountError('Too many attempts. Please try again in 15 minutes.', 429);
  }
  function signedIn(req: Request): Account {
    const account = accounts.session(cookies(req)[SESSION_COOKIE]);
    if (!account) throw new AccountError('Sign in to continue.', 401);
    return account;
  }
  function setSession(res: Response, account: Account, oldToken?: string) {
    accounts.revoke(oldToken);
    const session = accounts.issueSession(account);
    res.cookie(SESSION_COOKIE, session.token, { ...cookieOptions, expires: new Date(session.expires) });
  }
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const origin = req.get('origin');
      const allowed = origin && (origins.includes(origin) || origin === `${req.protocol}://${req.get('host')}`);
      const token = cookies(req)[CSRF_COOKIE]; const supplied = req.get('x-sk-csrf');
      if (!allowed || !token || !supplied || !/^[a-zA-Z0-9_-]{43}$/.test(token) || token.length !== supplied.length || !timingSafeEqual(Buffer.from(token), Buffer.from(supplied))) {
        res.status(403).json({ error: 'Refresh this page and try again.' }); return;
      }
    }
    next();
  });
  router.get('/session', (req, res) => {
    let csrf = cookies(req)[CSRF_COOKIE];
    if (!csrf || !/^[a-zA-Z0-9_-]{43}$/.test(csrf)) csrf = randomBytes(32).toString('base64url');
    res.cookie(CSRF_COOKIE, csrf, { ...cookieOptions, maxAge: 30 * 86400_000 });
    res.json({ account: accounts.session(cookies(req)[SESSION_COOKIE]), csrf });
  });
  // Password work is bounded by per-address and per-username attempts before scrypt starts.
  router.use(['/signup', '/login', '/recover', '/password', '/delete'], (req, _res, next) => {
    try {
      limit(`ip:${req.socket.remoteAddress ?? 'local'}`, 30);
      const name = typeof req.body?.username === 'string' ? req.body.username.toLowerCase().slice(0, 24) : signedIn(req).id;
      limit(`account:${name}`, 10);
      next();
    } catch (error) { next(error); }
  });
  router.post('/signup', async (req, res) => {
    const created = await accounts.signup(req.body?.username, req.body?.password);
    setSession(res, created.account, cookies(req)[SESSION_COOKIE]);
    res.status(201).json(created);
  });
  router.post('/login', async (req, res) => {
    const account = await accounts.login(req.body?.username, req.body?.password);
    setSession(res, account, cookies(req)[SESSION_COOKIE]);
    res.json({ account });
  });
  router.post('/recover', async (req, res) => {
    const recovered = await accounts.recover(req.body?.username, req.body?.recoveryCode, req.body?.password);
    setSession(res, recovered.account, cookies(req)[SESSION_COOKIE]);
    res.json(recovered);
  });
  router.post('/logout', (req, res) => {
    accounts.revoke(cookies(req)[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions); res.json({ ok: true });
  });
  router.post('/logout-all', (req, res) => {
    accounts.revokeAll(signedIn(req).id); res.clearCookie(SESSION_COOKIE, cookieOptions); res.json({ ok: true });
  });
  router.post('/password', async (req, res) => {
    const account = signedIn(req);
    const recoveryCode = await accounts.changePassword(account, req.body?.currentPassword, req.body?.password);
    setSession(res, account); res.json({ account, recoveryCode });
  });
  router.post('/delete', async (req, res) => {
    await accounts.deleteAccount(signedIn(req), req.body?.password);
    res.clearCookie(SESSION_COOKIE, cookieOptions); res.json({ ok: true });
  });
  router.get('/export', (req, res) => {
    res.attachment('skull-king-account.json').json(accounts.exportAccount(signedIn(req)));
  });
  router.get('/history', (req, res) => res.json({ matches: accounts.history(signedIn(req)) }));
  router.get('/leaderboard', (_req, res) => res.json({ players: accounts.leaderboard() }));
  router.get('/games', (req, res) => res.json({ games: accounts.linkedGames(signedIn(req), rooms.games) }));
  router.post('/seats/:gameId', (req, res) => {
    const account = signedIn(req); const id = String(req.params.gameId); const game = rooms.games.get(id);
    if (!game) throw new AccountError('This game is no longer available.', 404);
    if (typeof req.body?.playerToken !== 'string') throw new AccountError('A seat token is required.');
    accounts.bindSeat(account, id, game, req.body.playerToken);
    res.json({ ok: true });
  });
  router.post('/resume/:gameId', (req, res) => {
    const account = signedIn(req); const id = String(req.params.gameId); const game = rooms.games.get(id);
    if (!game) throw new AccountError('This game is no longer available.', 404);
    res.json({ playerToken: accounts.resumeSeat(account, id, game) });
  });
  router.use((error: Error, _req: Request, res: Response, _next: unknown) => {
    if (error instanceof AccountError) res.status(error.status).json({ error: error.message });
    else { console.error('Account request failed'); res.status(500).json({ error: 'Account request could not be completed. Please try again.' }); }
  });
  return router;
}
