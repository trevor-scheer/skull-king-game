import { ApolloServer } from '@apollo/server';
import { Game } from '../../../skull-king-core/src/game';
import { Rooms } from '../rooms';
import resolvers from '../resolvers';
import typeDefs from '../typeDefs';
import type { Context } from '../context';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('authenticates practice controls, heartbeats only valid players, and prevents stale takeovers',async()=>{
  const game=new Game('api',{roundSchedule:[1],tieBreakers:false}); const host=game.addPlayer('Host'); const friend=game.addPlayer('Friend');
  const server=new ApolloServer<Context>({typeDefs,resolvers});const context:Context={games:new Map([['api',game]])};
  async function execute(query:string,variables:Record<string,unknown>={}) {
    const result=await server.executeOperation({query,variables},{contextValue:context});
    if(result.body.kind!=='single')throw Error('single expected');return result.body.singleResult;
  }
  const add=`mutation($token:String!){addBot(gameId:"api",playerToken:$token)}`;
  try {
    expect((await execute(add,{token:friend})).errors?.[0].message).toContain('host');
    expect((await execute(add,{token:host})).errors).toBeUndefined();
    const state=await execute(`{state(gameId:"api"){practice players{id isBot isAutomated isAutoplay hand{...on ColoredCard{id}...on SpecialCard{id}}} me{id}}}`);
    expect(state.errors).toBeUndefined(); expect((state.data?.state as any).me).toBeNull();expect((state.data?.state as any).practice).toBe(true);
    expect(JSON.stringify(state.data)).not.toContain(host);expect(JSON.stringify(state.data)).not.toContain(friend);
    game.start();game.recordPresence(friend,1000);
    await execute(`query($token:String){state(gameId:"api",playerToken:$token){me{id} players{id lastSeenAt}}}`,{token:'stale'});
    expect(game.getStateForPlayer().players.find(player=>player.id==='Friend')!.lastSeenAt).toBe(1000);
    const stale=1000;
    await execute(`query($token:String){state(gameId:"api",playerToken:$token){me{id}}}`,{token:friend});
    const takeover=`mutation($token:String!,$seen:Float!){enableAwayAutoplay(gameId:"api",playerToken:$token,playerId:"Friend",expectedLastSeenAt:$seen)}`;
    const retry=await execute(takeover,{token:host,seen:stale});expect(retry.errors).toBeUndefined();expect(retry.data?.enableAwayAutoplay).toBe(false);
    const recent=game.getStateForPlayer().players.find(player=>player.id==='Friend')!.lastSeenAt;
    expect((await execute(takeover,{token:host,seen:recent})).errors?.[0].message).toContain('90 seconds');
    const autoplay=`mutation($token:String!,$enabled:Boolean!){setAutoplay(gameId:"api",playerToken:$token,enabled:$enabled)}`;
    expect((await execute(autoplay,{token:'stale',enabled:true})).errors).toBeDefined();
    expect((await execute(autoplay,{token:friend,enabled:true})).errors).toBeUndefined();
    expect((await execute(autoplay,{token:friend,enabled:false})).errors).toBeUndefined();
    expect(game.getStateForPlayer(friend).me!.isAutoplay).toBe(false);
  }finally{await server.stop();}
});

it('steps at most one autoplay action per interval and restores seats with reconnect grace',()=>{
  const directory=mkdtempSync(join(tmpdir(),'sk-practice-'));let now=Date.now();
  try{
    let rooms=new Rooms(directory,()=>now);const game=new Game('practice',{roundSchedule:[1],tieBreakers:false}); const host=game.addPlayer('Host');game.addBot(host);game.start();game.setAutoplay(host,true);rooms.games.set('practice',game);rooms.save('practice');
    const changed=jest.fn();rooms.updates.on('practice',changed);
    rooms.tick();expect(game.__debugDump().currentRound!.bids.size).toBe(1);
    rooms.tick();expect(game.__debugDump().currentRound!.bids.size).toBe(1);
    now+=750;rooms.tick();expect(game.__debugDump().currentRound!.bids.size).toBe(2);
    expect(changed).toHaveBeenCalledTimes(2);
    now+=100000;rooms=new Rooms(directory,()=>now);
    const restored=rooms.games.get('practice')!;
    expect(restored.getStateForPlayer(host).me).toMatchObject({isAutoplay:true,lastSeenAt:now});
    let ticks=0;
    while(restored.getStateForPlayer().phase!=='postgame') {expect(++ticks).toBeLessThan(50);now+=1000;rooms.tick();}
    expect(restored.getStateForPlayer().practice).toBe(true);
  }finally{rmSync(directory,{recursive:true,force:true});}
});
