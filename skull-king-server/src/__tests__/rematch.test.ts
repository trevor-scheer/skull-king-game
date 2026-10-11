import { ApolloServer } from '@apollo/server';
import { Game, isSpecialCard } from '@skull-king/core';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Context } from '../context';
import { Rooms } from '../rooms';
import typeDefs from '../typeDefs';
import resolvers from '../resolvers';
test('rematches are idempotent, preserve each seat privately, and checkpoint literal mutations', async () => {
  const dir = mkdtempSync(join(tmpdir(),'skull-rematch-'));
  const rooms = new Rooms(dir);
  const game = new Game('first',{roundSchedule:[1],tieBreakers:false});
  const tokens = ['Anne','Mary','Jack'].map(name => game.addPlayer(name));
  rooms.games.set('first',game);
  game.start();
  tokens.forEach(playerToken => game.submitBid({playerToken,count:0}));
  while(game.getStateForPlayer().currentRound!.phase === 'play') {
    const id = game.getStateForPlayer().currentRound!.playerTurn;
    const token = tokens.find(token => game.getStateForPlayer(token).me!.id === id)!;
    const card = game.getStateForPlayer(token).me!.hand[0];
    game.playCard({playerToken:token,cardId:card.id,selection:isSpecialCard(card)&&card.type==='tigress'?'escape':undefined});
  }
  game.advanceFromTrickResult();
  const scores = game.getStateForPlayer().scorecard;
  const server = new ApolloServer<Context>({typeDefs,resolvers});
  const run = async (token:string) => {
    const response = await server.executeOperation({query:`mutation { rematchGame(gameId:"first",playerToken:"${token}") }`},{contextValue:{games:rooms.games,rooms}});
    if(response.body.kind !== 'single') throw Error('Expected response');
    return response.body.singleResult;
  };
  try {
    expect((await run('outsider')).errors).toBeDefined();
    const first = await run(tokens[0]);
    expect(first.errors).toBeUndefined();
    const id = first.data!.rematchGame as string;
    expect((await run(tokens[1])).data!.rematchGame).toBe(id);
    expect(rooms.games.size).toBe(2);
    const restored = new Rooms(dir);
    const next = restored.games.get(id)!;
    expect(restored.games.get('first')!.getStateForPlayer().nextGameId).toBe(id);
    expect(next.getStateForPlayer()).toMatchObject({phase:'setup',roundSchedule:[1],currentRound:null});
    tokens.forEach((token,index) => expect(next.getStateForPlayer(token).me!.name).toBe(['Anne','Mary','Jack'][index]));
    expect(next.getStateForPlayer().me).toBeUndefined();
    expect(game.getStateForPlayer().scorecard).toEqual(scores);
    next.start();
    expect(next.getStateForPlayer().currentRound!.roundNumber).toBe(1);
  } finally { await server.stop(); rmSync(dir,{recursive:true,force:true}); }
});
