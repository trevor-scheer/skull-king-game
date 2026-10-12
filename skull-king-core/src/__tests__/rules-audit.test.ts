import { Game } from '../game';

function gameWithHands(hands: string[][]) {
  const game = new Game('rules-audit', {
    deckConfig: { includeStingray: true, includeDavyJones: true, includeKraken: true, includeWhiteWhale: true },
    roundSchedule: [2], tieBreakers: false,
  });
  const tokens = hands.map((_, index) => game.addPlayer(`P${index}`));
  game.start();
  const debug = game.__debugDump();
  debug.currentRound!.leader = 0;
  debug.players.forEach((player,index) => { player.hand = hands[index].map(id => debug.deck.getCard(id)!); });
  tokens.forEach(playerToken => game.submitBid({ playerToken, count: 0 }));
  const play = (player: number, cardId: string) => game.playCard({playerToken: tokens[player], cardId});
  return { game, tokens, play };
}

it('follows the expansion FAQ: Stingray defers a leading suit without counting as an Escape', () => {
  const {game,tokens,play} = gameWithHands([['stingray','yellow-1'],['green-5','yellow-2'],['yellow-9','green-10']]);
  play(0,'stingray'); play(1,'green-5');
  expect(game.getStateForPlayer(tokens[2]).legalCardIds).toEqual(['green-10']);
  expect(()=>play(2,'yellow-9')).toThrow('Illegal move');
  play(2,'green-10');
  expect(game.getStateForPlayer().currentRound!.lastCompletedHand!.winningCard!.playerId).toBe('P1');
});

it('applies the White Whale suit convention to Stingray played after a numbered lead', () => {
  const {game,tokens,play} = gameWithHands([['green-5','yellow-1'],['stingray','yellow-2'],['yellow-9','green-10']]);
  play(0,'green-5'); play(1,'stingray');
  expect(game.getStateForPlayer(tokens[2]).legalCardIds).toEqual(['green-10']);
  expect(()=>play(2,'yellow-9')).toThrow('Illegal move');
  play(2,'green-10');
  expect(game.getStateForPlayer().currentRound!.lastCompletedHand!.winningCard!.playerId).toBe('P0');
});

it('Davy removes Stingray before resolving the ordinary trick winner', () => {
  const {game,play} = gameWithHands([['stingray','yellow-1'],['green-5','yellow-2'],['green-10','yellow-3'],['davyJones','yellow-4']]);
  play(0,'stingray'); play(1,'green-5'); play(2,'green-10'); play(3,'davyJones');
  expect(game.getStateForPlayer().currentRound!.lastCompletedHand!.winningCard!.playerId).toBe('P2');
});
