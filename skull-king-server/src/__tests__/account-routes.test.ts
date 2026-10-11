import express from 'express';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Accounts } from '../accounts';
import { accountRoutes } from '../accountRoutes';
import { Rooms } from '../rooms';
import { Game } from '../../../skull-king-core/src/game';

let server: Server; let accounts: Accounts; let rooms: Rooms; let directory: string; let base: string;
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'sk-account-http-'));
  accounts = new Accounts(join(directory, 'accounts.sqlite')); rooms = new Rooms(join(directory, 'rooms'));
  const app = express(); app.use(express.json()); app.use('/api/account', accountRoutes(accounts, rooms, ['http://localhost:5173']));
  server = createServer(app); await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/account`;
});
afterEach(async () => { await new Promise<void>(resolve => server.close(() => resolve())); accounts.close(); rmSync(directory, { recursive: true, force: true }); });
function browser() {
  const cookies = new Map<string,string>(); let csrf = '';
  return {
    cookies,
    async request(path: string, body?: unknown, extra: Record<string,string> = {}) {
      const response = await fetch(`${base}/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: [...cookies].map(([key,value]) => `${key}=${value}`).join('; '), Origin: 'http://localhost:5173', 'Content-Type': 'application/json', 'X-SK-CSRF': csrf, ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      for (const value of response.headers.getSetCookie()) { const [pair] = value.split(';'); const index = pair.indexOf('='); cookies.set(pair.slice(0,index), pair.slice(index+1)); }
      const data = await response.json() as any; if (data.csrf) csrf = data.csrf;
      return { response, data };
    },
  };
}
const credentials = { username: 'alice', password: 'one long passphrase' };
it('requires CSRF and an allowed origin, uses private cookies, and revokes logout', async () => {
  const client = browser();
  expect((await client.request('signup', credentials)).response.status).toBe(403);
  const session = await client.request('session'); expect(session.data.account).toBeNull();
  expect(session.response.headers.get('cache-control')).toBe('no-store');
  expect((await client.request('signup', credentials, { Origin: 'https://attacker.example' })).response.status).toBe(403);
  const created = await client.request('signup', credentials); expect(created.response.status).toBe(201);
  const cookie = created.response.headers.getSetCookie().find(value => value.startsWith('sk_session'))!;
  expect(cookie).toContain('HttpOnly'); expect(cookie).toContain('SameSite=Strict'); expect(cookie).toContain('Expires=');
  const rawToken = client.cookies.get('sk_session')!;
  expect(JSON.stringify(created.data)).not.toContain(rawToken);
  expect((await client.request('session')).data.account.username).toBe('alice');
  expect((await client.request('logout', {})).response.status).toBe(200);
  client.cookies.set('sk_session', rawToken);
  expect((await client.request('history')).response.status).toBe(401);
});

it('keeps seat credentials owner-only across devices, never trusts a matching display name', async () => {
  const first = browser(); const second = browser(); const stranger = browser();
  for (const client of [first, second, stranger]) await client.request('session');
  await first.request('signup', credentials);
  await second.request('login', credentials);
  await stranger.request('signup', { username: 'bob', password: credentials.password });
  const game = new Game('room'); const token = game.addPlayer('bob'); game.addPlayer('alice'); rooms.games.set('room', game);
  expect((await first.request('seats/room', { playerToken: 'bob' })).response.status).toBe(403);
  expect((await first.request('seats/room', { playerToken: token })).response.status).toBe(200);
  expect((await stranger.request('resume/room', {})).response.status).toBe(404);
  expect((await stranger.request('seats/room', { playerToken: token })).response.status).toBe(409);
  const resumed = await second.request('resume/room', {}); expect(resumed.data.playerToken).toBe(token);
  const listed = await second.request('games'); expect(listed.data.games).toHaveLength(1); expect(JSON.stringify(listed.data)).not.toContain(token);
  const unauthenticated = browser(); await unauthenticated.request('session');
  expect((await unauthenticated.request('resume/room', {})).response.status).toBe(401);
  expect((await unauthenticated.request('history')).response.status).toBe(401);
  expect((await unauthenticated.request('export')).response.status).toBe(401);
});

it('supports one-use recovery and export/delete without leaking hashes or tokens', async () => {
  const first = browser(); await first.request('session'); const created = await first.request('signup', credentials);
  const recovered = browser(); await recovered.request('session');
  const reset = await recovered.request('recover', { username: credentials.username, recoveryCode: created.data.recoveryCode, password: 'a fresh passphrase' });
  expect(reset.response.status).toBe(200);
  expect((await first.request('history')).response.status).toBe(401);
  expect((await recovered.request('recover', { username: credentials.username, recoveryCode: created.data.recoveryCode, password: credentials.password })).response.status).toBe(401);
  const exported = await recovered.request('export');
  expect(exported.data.account.username).toBe('alice'); expect(JSON.stringify(exported.data)).not.toContain('password'); expect(JSON.stringify(exported.data)).not.toContain('recovery');
  expect((await recovered.request('delete', { password: 'a fresh passphrase' })).response.status).toBe(200);
  expect((await recovered.request('session')).data.account).toBeNull();
});

it('limits password attempts before performing unbounded password work', async () => {
  const client = browser(); await client.request('session');
  for (let index=0; index<10; index++) expect((await client.request('login', { username:'missing', password:'bad' })).response.status).toBe(401);
  expect((await client.request('login', { username:'missing', password:'bad' })).response.status).toBe(429);
});
