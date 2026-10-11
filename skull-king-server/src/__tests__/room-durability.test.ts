import { mkdtempSync, readFileSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Game } from '@skull-king/core';
import { Rooms } from '../rooms';
import resolvers from '../resolvers';

let directory: string;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'sk-durability-')); });
afterEach(() => { rmSync(directory, { recursive: true, force: true }); });

it('preserves activity time across shutdown saves and restarts', () => {
  let now = Date.now();
  let rooms = new Rooms(directory, () => now);
  rooms.games.set('idle', new Game('idle'));
  rooms.save('idle');
  now += 23 * 3600_000;
  (rooms.save as (id: string, touch?: boolean) => void)('idle', false);
  utimesSync(join(directory, 'idle.room'), new Date(now), new Date(now));
  rooms = new Rooms(directory, () => now);
  now += 2 * 3600_000;
  rooms.tick();
  expect(rooms.games.has('idle')).toBe(false);
});

it('restores legacy checkpoints using their existing modification time', () => {
  const now = Date.now();
  const game = new Game('legacy'); const token = game.addPlayer('Anne');
  const path = join(directory, 'legacy.room');
  writeFileSync(path, game.checkpoint());
  const old = new Date(now - 25 * 3600_000); utimesSync(path, old, old);
  const rooms = new Rooms(directory, () => now);
  expect(rooms.games.get('legacy')!.getStateForPlayer(token).me?.name).toBe('Anne');
  rooms.tick();
  expect(rooms.games.has('legacy')).toBe(false);
});

it('rolls back a rejected join when its checkpoint cannot be written', async () => {
  const rooms = new Rooms(directory);
  rooms.games.set('room', new Game('room')); rooms.save('room');
  const checkpoint = readFileSync(join(directory, 'room.room'));
  jest.spyOn(rooms, 'save').mockImplementation(() => { throw Error('disk full'); });
  const addPlayer = (resolvers as any).Mutation.addPlayer;
  await expect(Promise.resolve().then(() => addPlayer(null, { gameId: 'room', name: 'Anne' }, { rooms, games: rooms.games }, null))).rejects.toThrow('disk full');
  expect(rooms.games.get('room')!.getStateForPlayer().players).toHaveLength(0);
  expect(readFileSync(join(directory, 'room.room'))).toEqual(checkpoint);
});
