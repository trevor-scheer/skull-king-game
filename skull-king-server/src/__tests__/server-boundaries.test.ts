import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Game } from '@skull-king/core';
import { createApplication } from '../index';

let application: Awaited<ReturnType<typeof createApplication>>;
let server: Server; let directory: string; let base: string;
beforeEach(async () => {
  directory = mkdtempSync(join(tmpdir(), 'sk-boundaries-'));
  application = await createApplication(directory);
  server = createServer(application.app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  await application.stop(); server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
  rmSync(directory, { recursive: true, force: true });
});
const graphql = (body: unknown) => fetch(`${base}/graphql`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

it('accepts ten read queries together and rejects write or oversized batches before execution', async () => {
  const query = { query: '{ games }' };
  const response = await graphql(Array.from({ length: 10 }, () => query));
  expect(response.status).toBe(200);
  expect(await response.json()).toHaveLength(10);
  expect((await graphql(Array.from({ length: 11 }, () => query))).status).toBe(400);
  expect((await graphql([query, { query: 'mutation { newGame }' }])).status).toBe(400);
  expect(application.rooms.games.size).toBe(0);
});

it('rejects alias floods, expanded fragment floods and multiple writes per request', async () => {
  const flood = await graphql({ query: `{ ${Array.from({ length: 21 }, (_, index) => `g${index}:games`).join(' ')} }` });
  expect(flood.status).toBe(400); expect(JSON.stringify(await flood.json())).toContain('too complex');
  const fragment = Array.from({ length: 100 }, (_, index) => `id${index}:id`).join(' ');
  const expanded = await graphql({ query: `query{state(gameId:"x"){...Part ...Part ...Part ...Part ...Part ...Part}} fragment Part on GameState {${fragment}}` });
  expect(expanded.status).toBe(400); expect(JSON.stringify(await expanded.json())).toContain('too complex');
  const writes = await graphql({ query: 'mutation { one:newGame two:newGame }' });
  expect(writes.status).toBe(400); expect(application.rooms.games.size).toBe(0);
});

it('bounds shared-address event streams and releases every listener on shutdown', async () => {
  application.rooms.games.set('room', new Game('room'));
  const responses: Response[] = [];
  try {
    for (let index = 0; index < 32; index++) {
      const response = await fetch(`${base}/events/room`); responses.push(response);
      expect(response.status).toBe(200);
    }
    expect(application.rooms.updates.listenerCount('room')).toBe(32);
    expect((await fetch(`${base}/events/room`)).status).toBe(429);
    application.rooms.games.delete('room'); application.rooms.updates.emit('room');
    expect(application.rooms.updates.listenerCount('room')).toBe(0);
  } finally { await Promise.all(responses.map(response => response.body?.cancel())); }
});

it('requires HTTPS for production accounts and trusts forwarded protocol only from configured proxies', async () => {
  const previous = process.env.NODE_ENV; process.env.NODE_ENV = 'production';
  try {
    expect((await fetch(`${base}/api/account/session`, { headers: { 'X-Forwarded-Proto': 'https' } })).status).toBe(400);
    application.app.set('trust proxy', 'loopback');
    const response = await fetch(`${base}/api/account/session`, { headers: { 'X-Forwarded-Proto': 'https' } });
    expect(response.status).toBe(200); expect(response.headers.get('strict-transport-security')).toContain('max-age');
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});
