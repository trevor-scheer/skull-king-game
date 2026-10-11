import { Game } from '../game';
import { Deck } from '../deck';
import * as policy from '../botPolicy';

it('keeps NPC credentials private and transfers the host when someone leaves the lobby', () => {
  const game = new Game('crew'); const host = game.addPlayer('Host'); const other = game.addPlayer('Friend');
  expect(()=>game.addBot(other)).toThrow('Only the host');
  const bot = game.addBot(host);
  expect(game.getStateForPlayer().players.find(player=>player.id===bot)).toMatchObject({isBot:true,isAutomated:false,isAutoplay:true,hand:[]});
  expect(game.getStateForPlayer().practice).toBe(true);
  expect(()=>game.removeBot(other,bot)).toThrow('Only the host');
  game.leaveGame(host);
  expect(game.getStateForPlayer(host).me).toBeUndefined();
  expect(()=>game.addBot(host)).toThrow('human seat');
  expect(game.addBot(other)).toBeDefined();
  game.removeBot(other,bot);
  expect(game.getStateForPlayer().practice).toBe(true);
});

it('requires a current 90-second absence observation and lets a returning player reclaim the seat', () => {
  const game = new Game('away'); const host = game.addPlayer('Host'); const other = game.addPlayer('Friend'); game.start();
  game.recordPresence(other,1000);
  expect(()=>game.enableAwayAutoplay(other,'Host',1000,100000)).toThrow('Only the host');
  expect(()=>game.enableAwayAutoplay(host,'Friend',1000,90000)).toThrow('90 seconds');
  expect(game.recordPresence('invalid',100000)).toBe(false);
  game.recordPresence(other,2000);
  expect(game.enableAwayAutoplay(host,'Friend',1000,100000)).toBe(false);
  expect(game.enableAwayAutoplay(host,'Friend',2000,100000)).toBe(true);
  expect(game.getStateForPlayer(other).me!.isAutoplay).toBe(true);
  game.setAutoplay(other,false);
  expect(game.getStateForPlayer(other).me!.isAutoplay).toBe(false);
  expect(game.getStateForPlayer().practice).toBe(true);
});

it('survives restart with NPCs and delegated seats, but resets delegation in a rematch', () => {
  const game = new Game('restart',{roundSchedule:[1],tieBreakers:false}); const host=game.addPlayer('Host'); game.addBot(host); game.start(); game.setAutoplay(host,true);
  let restored=Game.restoreCheckpoint(game.checkpoint());
  expect(restored.getStateForPlayer(host).me!.isAutoplay).toBe(true);
  for(let count=0;restored.getStateForPlayer().phase!=='postgame';count++) {
    expect(count).toBeLessThan(100);
    if(!restored.stepAutoplay()) restored.advanceFromTrickResult();
    restored=Game.restoreCheckpoint(restored.checkpoint());
  }
  const next=restored.createRematch('next');
  expect(next.getStateForPlayer(host).me!.isAutoplay).toBe(false);
  expect(next.getStateForPlayer().players.find(player=>player.isBot)?.isAutoplay).toBe(true);
  expect(next.getStateForPlayer().practice).toBe(true);
});

it.each([2,3,6,9])('finishes all-card matches with %i virtual players and bounded private decisions', (count) => {
  const deckConfig={includeMermaids:true,includeLoot:true,includeKraken:true,includeWhiteWhale:true,includeExpansion:true,includeFirstMate:true,includeStingray:true,includeDavyJones:true,includeWalkThePlank:true,includeLastVolley:true};
  const game=new Game(`all-${count}`,{deckConfig,deck:new Deck({deckConfig,shuffleSeed:.99}),roundSchedule:[1,3,5,8],tieBreakers:false,scoringMode:'rascal',cannonball:true,pirateAbilities:true});
  const host=game.addPlayer('Host'); for(let index=1;index<count;index++)game.addBot(host); game.start();game.setAutoplay(host,true);
  const choose=jest.spyOn(policy,'chooseBotAction');
  let actions=0; let abilities=0;
  while(game.getStateForPlayer().phase!=='postgame') {
    expect(++actions).toBeLessThan(1500);
    if(game.getStateForPlayer().currentRound?.pirateAbility)abilities++;
    if(!game.stepAutoplay()) {
      const round=game.getStateForPlayer().currentRound!;
      expect(round.phase).toBe('trick_result');expect(round.pirateAbility).toBeNull();
      game.advanceFromTrickResult(round.lastCompletedHand!.id);
    }
  }
  for(const [view] of choose.mock.calls) {
    expect(Object.keys(view).sort()).toEqual(['ability','bid','cardsPerPlayer','forcedCardId','hand','legalCardIds','phase','plankChoice','playerId','players','trickColor','tricksWon'].sort());
    expect(view.players.every(player=>Object.keys(player).sort().join(',')==='handCount,id')).toBe(true);
    expect(view).not.toHaveProperty('deck');expect(view).not.toHaveProperty('bids');
  }
  choose.mockRestore();
  expect(game.getStateForPlayer().scorecard).toHaveLength(4);
  expect(game.getStateForPlayer().scorecard![0]).toHaveLength(count);
  if(count===3||count===6)expect(abilities).toBeGreaterThan(0);
});

it('completes a delegated mid-power choice and respects a forced card during discard', () => {
  const view:policy.BotView={playerId:'A',hand:[{id:'a',color:'YELLOW',number:1},{id:'b',color:'GREEN',number:2},{id:'c',color:'BLACK',number:3}],legalCardIds:[],phase:'trick_result',bid:1,tricksWon:1,cardsPerPlayer:2,trickColor:null,forcedCardId:'a',players:[{id:'A',handCount:3},{id:'B',handCount:1}],ability:{id:'power',kind:'bendt',stage:'discard',canDecline:true},plankChoice:null};
  expect(policy.chooseBotAction(view)).toMatchObject({kind:'ability',input:{action:'discard',cardIds:['b','c']}});
  view.ability={id:'mary',kind:'mary',stage:'choose',canDecline:false};
  expect(policy.chooseBotAction(view)).toMatchObject({input:{action:'forceCard',playerId:'B'}});
  view.ability={id:'juanita',kind:'juanita',stage:'view',canDecline:true};
  expect(policy.chooseBotAction(view)).toMatchObject({input:{action:'finish'}});
});

it.each(['classic','rascal'] as const)('finishes a standard ten-round %s practice match',scoringMode=>{
  const game=new Game('standard',{scoringMode,deck:new Deck({shuffleSeed:.31}),tieBreakers:false});const host=game.addPlayer('Host');game.addBot(host);game.addBot(host);game.start();game.setAutoplay(host,true);
  let actions=0;
  while(game.getStateForPlayer().phase!=='postgame') {
    expect(++actions).toBeLessThan(1000);
    if(!game.stepAutoplay())game.advanceFromTrickResult();
  }
  expect(game.getStateForPlayer().scorecard).toHaveLength(10);
});

it('resolves mandatory Mary when the winning human has delegated their seat',()=>{
  const game=new Game('mary',{deckConfig:{includeExpansion:true},pirateAbilities:true,roundSchedule:[2],tieBreakers:false});const host=game.addPlayer('Host');const second=game.addPlayer('Second');game.addBot(host);game.start();
  const debug=game.__debugDump();const hands=[['maryThorne','yellow-1'],['green-1','green-2'],['yellow-2','yellow-3']];
  debug.players.forEach((player,index)=>{player.hand=hands[index].map(id=>debug.deck.getCard(id)!);});
  game.setAutoplay(host,true);game.setAutoplay(second,true);
  let steps=0;
  while(!game.getStateForPlayer().currentRound!.pirateAbility) {expect(++steps).toBeLessThan(10);expect(game.stepAutoplay()).toBe(true);}
  expect(game.getStateForPlayer().currentRound!.pirateAbility).toMatchObject({kind:'mary',playerId:'Host',canDecline:false});
  expect(game.stepAutoplay()).toBe(true);
  expect(game.getStateForPlayer().currentRound!.pirateAbility).toBeNull();
  expect(game.__debugDump().currentRound!.forcedCards?.size).toBe(1);
});
