import { types } from 'node:util';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Game, isSpecialCard } from '@skull-king/core';
import { Rooms } from '../rooms';
import { requireHost, requirePlayer } from '../permissions';

test('a server restart preserves private seats, remaining deck, legal play and scores', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skull-rooms-'));
  try {
    let rooms = new Rooms(dir);
    let game = new Game('persistent');
    const tokens = ['Anne','Mary','Jack'].map(name => game.addPlayer(name));
    game.start();
    rooms.games.set('persistent', game);
    for (let action = 0; action < 75; action++) {
      const state = game.getStateForPlayer();
      const round = state.currentRound!;
      if (round.phase === 'bid') tokens.forEach(token => game.submitBid({playerToken:token,count:0}));
      else if (round.phase === 'trick_result') game.advanceFromTrickResult(round.lastCompletedHand!.id);
      else {
        const token = tokens.find(t => game.getStateForPlayer(t).me!.id === round.playerTurn)!;
        const hand = game.getStateForPlayer(token).me!.hand;
        const suited = hand.filter(c => !isSpecialCard(c) && c.color === round.trickColor);
        const card = hand.find(c => isSpecialCard(c) || !round.trickColor || suited.length === 0 || (!isSpecialCard(c) && c.color === round.trickColor))!;
        game.playCard({playerToken:token,cardId:card.id,selection:isSpecialCard(card) && card.type === 'tigress' ? 'escape' : undefined});
      }
      const comparable = (value: unknown) => JSON.parse(JSON.stringify(value, (_key, item) => types.isMap(item) ? [...item.entries()] : types.isSet(item) ? [...item.values()] : item));
      const expected = comparable(tokens.map(token => game.getStateForPlayer(token)));
      rooms.save('persistent');
      rooms = new Rooms(dir);
      game = rooms.games.get('persistent')!;
      expect(comparable(tokens.map(token => game.getStateForPlayer(token)))).toEqual(expected);
      expect(game.getStateForPlayer().players.every(p => p.hand.length === 0)).toBe(true);
    }
    expect(game.getStateForPlayer().scorecard!.length).toBeGreaterThan(1);
  } finally { rmSync(dir, {recursive:true,force:true}); }
});

test('host-only start and participant-only advancement reject outsiders', () => {
  const game = new Game('permissions');
  const host = game.addPlayer('Anne');
  const guest = game.addPlayer('Mary');
  expect(() => requireHost(game)).toThrow('Join');
  expect(() => requireHost(game, guest)).toThrow('host');
  expect(() => requireHost(game, host)).not.toThrow();
  expect(() => requirePlayer(game, guest)).not.toThrow();
  expect(() => requirePlayer(game, 'forged')).toThrow('Join');
});

test('unused rooms expire, while saved rooms survive maintenance', () => {
  const dir = mkdtempSync(join(tmpdir(), 'skull-expiry-'));
  let now = Date.now();
  try {
    const rooms = new Rooms(dir, () => now);
    rooms.games.set('old', new Game('old'));
    rooms.games.set('fresh', new Game('fresh'));
    rooms.save('old'); rooms.save('fresh');
    now += 25 * 3600_000;
    rooms.save('fresh'); rooms.tick();
    expect([...rooms.games.keys()]).toEqual(['fresh']);
    expect([...new Rooms(dir).games.keys()]).toEqual(['fresh']);
  } finally { rmSync(dir, {recursive:true,force:true}); }
});
