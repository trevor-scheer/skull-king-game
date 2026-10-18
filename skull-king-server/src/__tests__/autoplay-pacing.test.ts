import { Game } from '@skull-king/core';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Rooms } from '../rooms';

let directory: string;
let now: number;
let rooms: Rooms;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'sk-pacing-'));
  now = 100_000;
  rooms = new Rooms(directory, () => now);
  jest.spyOn(Date, 'now').mockImplementation(() => now);
});
afterEach(() => {
  jest.restoreAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

function fixture(graybeard = false, reveal = false) {
  const game = new Game('paced', { roundSchedule: [2], tieBreakers: false, bidRevealDurationMs: reveal ? 4500 : 0 });
  const host = game.addPlayer('Host');
  const friend = game.addPlayer('Friend');
  if (!graybeard) game.addBot(host);
  rooms.games.set('paced', game);
  rooms.save('paced');
  rooms.mutate('paced', () => {
    game.start();
    const debug = game.__debugDump();
    debug.players.forEach((player, index) => {
      player.hand = [`yellow-${index + 1}`, `yellow-${index + 4}`].map(id => debug.deck.getCard(id)!);
    });
    game.submitBid({ playerToken: host, count: 0 });
    game.submitBid({ playerToken: friend, count: 0 });
    if (!graybeard) game.stepAutoplay();
  });
  return { game, host, friend };
}

it.each([false, true])('waits for a fresh turn before the automated card and immediately returns control to humans (Graybeard: %s)', graybeard => {
  const { game, host, friend } = fixture(graybeard);
  now += 60_000;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toEqual([]);
  rooms.mutate('paced', () => game.playCard({ playerToken: friend, cardId: 'yellow-2' }));
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
  rooms.tick();
  now += 1399;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
  now++;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(2);
  expect(game.getStateForPlayer(host).currentRound!.playerTurn).toBe('Host');
  rooms.mutate('paced', () => game.playCard({ playerToken: host, cardId: 'yellow-1' }));
  expect(game.getStateForPlayer().currentRound!.phase).toBe('trick_result');
});

it('gives the first automated player a fresh pause after the bid reveal and spaces consecutive decisions', () => {
  const { game, friend } = fixture(false, true);
  rooms.mutate('paced', () => game.setAutoplay(friend, true));
  const deadline = game.getStateForPlayer().currentRound!.bidRevealEndsAt!;
  now = deadline - 1;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.phase).toBe('bid');
  now++;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.phase).toBe('play');
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(0);
  now += 1399;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(0);
  now++;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
  rooms.tick();
  now += 1399;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
  now++;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(2);
});

it('restores pending automated turns with a fresh pause and durably saves exactly one card', () => {
  const { friend } = fixture(true);
  rooms.mutate('paced', () => rooms.games.get('paced')!.playCard({ playerToken: friend, cardId: 'yellow-2' }));
  rooms.tick();
  now += 1000;
  rooms = new Rooms(directory, () => now);
  const restored = rooms.games.get('paced')!;
  rooms.tick();
  now += 1399;
  rooms.tick();
  expect(restored.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
  now++;
  const fail = jest.spyOn(rooms, 'save').mockImplementationOnce(() => { throw Error('Disk unavailable'); });
  expect(() => rooms.tick()).toThrow('Disk unavailable');
  expect(rooms.games.get('paced')!.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
  fail.mockRestore();
  rooms.tick();
  rooms.tick();
  expect(rooms.games.get('paced')!.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(2);
  rooms = new Rooms(directory, () => now);
  expect(rooms.games.get('paced')!.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(2);
});

it('cancels a pending delegated move when the human takes control back', () => {
  const { game, friend } = fixture();
  rooms.mutate('paced', () => game.setAutoplay(friend, true));
  rooms.tick();
  now += 1000;
  rooms.mutate('paced', () => game.setAutoplay(friend, false));
  rooms.tick();
  now += 1000;
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(0);
  rooms.mutate('paced', () => game.playCard({ playerToken: friend, cardId: 'yellow-2' }));
  rooms.tick();
  expect(game.getStateForPlayer().currentRound!.cardsPlayed).toHaveLength(1);
});
