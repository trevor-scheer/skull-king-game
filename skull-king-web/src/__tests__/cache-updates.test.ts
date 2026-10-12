import { gql } from '@apollo/client';
import { client } from '../client';

const full = gql`query Full($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id me { id name hand { ... on ColoredCard { id color number } } }
    currentRound { id roundNumber myBid cardsPlayed { id playerId card { ... on ColoredCard { id color number } } } }
  }
}`;
const summary = gql`query Summary($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id me { id name } currentRound { id cardsPlayed { id playerId } }
  }
}`;
const variables = { gameId: 'room', playerToken: 'anne-token' };
const card = { __typename: 'ColoredCard', id: 'yellow-7', color: 'yellow', number: 7 };
const played = { __typename: 'PlayedCard', id: 'anne-yellow-7', playerId: 'anne', card };
const initial = () => ({ state: {
  __typename: 'GameState', id: 'room',
  me: { __typename: 'Player', id: 'anne', name: 'Anne', hand: [card] },
  currentRound: { __typename: 'Round', id: 2, roundNumber: 2, myBid: 1, cardsPlayed: [played] },
} });
const status = (roundId = 2, cardsPlayed: object[] = [{ __typename: 'PlayedCard', id: played.id, playerId: 'anne' }]) => ({ state: {
  __typename: 'GameState', id: 'room', me: { __typename: 'Player', id: 'anne', name: 'Anne updated' },
  currentRound: { __typename: 'Round', id: roundId, cardsPlayed },
} });

beforeEach(() => client.cache.restore({}));
const read = () => client.cache.readQuery({ query: full, variables });
const writeFull = () => client.cache.writeQuery({ query: full, variables, data: initial() });
const writeSummary = (data = status()) => client.cache.writeQuery({ query: summary, variables, data });

test('partial polling preserves the same round, private hand, and played card details', () => {
  writeFull();
  writeSummary();
  const expected = initial();
  expected.state.me.name = 'Anne updated';
  expect(read()).toEqual(expected);
});

test('new trick membership replaces played cards without losing other round fields', () => {
  writeFull();
  writeSummary(status(2, []));
  const expected = initial();
  expected.state.me.name = 'Anne updated';
  expected.state.currentRound.cardsPlayed = [];
  expect(read()).toEqual(expected);
});

test('a new round does not inherit private or card data from the old round', () => {
  writeFull();
  writeSummary(status(3, []));
  const state = client.cache.readQuery<any>({ query: full, variables, returnPartialData: true })!.state;
  expect(state.currentRound).toEqual({ __typename: 'Round', id: 3, cardsPlayed: [] });
});

test('a delayed earlier round cannot replace the current round', () => {
  writeFull();
  writeSummary(status(1, []));
  const result = client.cache.readQuery<any>({ query: full, variables, returnPartialData: true });
  expect(result!.state.currentRound).toEqual(initial().state.currentRound);
});

test('public and other-player reads cannot overwrite the current viewer snapshot', () => {
  writeFull();
  const data = { state: { __typename: 'GameState', id: 'room', me: null,
    currentRound: { __typename: 'Round', id: 2, cardsPlayed: [] } } };
  client.cache.writeQuery({ query: summary, variables: { ...variables, playerToken: '' }, data });
  expect(read()).toEqual(initial());
  const other = initial();
  other.state.me = { ...other.state.me, id: 'mary', name: 'Mary', hand: [] };
  other.state.currentRound.myBid = 0;
  client.cache.writeQuery({ query: full, variables: { ...variables, playerToken: 'mary-token' }, data: other });
  expect(read()).toEqual(initial());
});

test('null lifecycle fields replace previous snapshots', () => {
  writeFull();
  client.cache.writeQuery({ query: summary, variables, data: { state: {
    __typename: 'GameState', id: 'room', me: null, currentRound: null,
  } } });
  expect(read()).toEqual({ state: { __typename: 'GameState', id: 'room', me: null, currentRound: null } });
});

test('a repeated card ID in a later round does not inherit its earlier card face', () => {
  writeFull();
  writeSummary(status(3));
  const state = client.cache.readQuery<any>({ query: full, variables, returnPartialData: true })!.state;
  expect(state.currentRound).toEqual({ __typename: 'Round', id: 3,
    cardsPlayed: [{ __typename: 'PlayedCard', id: played.id, playerId: 'anne' }] });
});

const playerTable = gql`query PlayerTable($gameId:String!,$playerToken:String) {
  state(gameId:$gameId,playerToken:$playerToken) {
    id players { id name isAutomated handCount bid tricksWon }
  }
}`;
const practiceState = gql`query PracticeState($gameId:String!,$playerToken:String) {
  state(gameId:$gameId,playerToken:$playerToken) {
    phase practice maxPlayers me { id isAutoplay }
    players { id name isBot isAutomated isAutoplay lastSeenAt }
  }
}`;
const seats = [
  { __typename:'Player', id:'anne', name:'Anne', isAutomated:false, handCount:3, bid:1, tricksWon:0 },
  { __typename:'Player', id:'mary', name:'Mary', isAutomated:false, handCount:2, bid:2, tricksWon:1 },
];
const seatState = (players = seats) => ({ state:{__typename:'GameState',id:'room',players} });
function writePractice(players = seats, viewer = variables) {
  client.cache.writeQuery({ query:practiceState, variables:viewer, data:{ state:{
    __typename:'GameState', phase:'play', practice:true, maxPlayers:8,
    me:{__typename:'Player',id:'anne',isAutoplay:false},
    players:players.map(({id,name,isAutomated}) => ({__typename:'Player',id,name,isAutomated,
      isBot:false,isAutoplay:false,lastSeenAt:12345})),
  } } });
}

test('practice seat updates preserve hand counts, bids, and tricks for matching players', () => {
  client.cache.writeQuery({query:playerTable,variables,data:seatState()});
  writePractice();
  expect(client.cache.readQuery({query:playerTable,variables})).toEqual(seatState());
});

test('incoming player membership and order stay authoritative without copying another seat', () => {
  client.cache.writeQuery({query:playerTable,variables,data:seatState()});
  writePractice([seats[1], {...seats[0],id:'new-seat',name:'New pirate'}]);
  const result = client.cache.readQuery<any>({query:playerTable,variables,returnPartialData:true});
  expect(result!.state.players).toEqual([
    seats[1], {__typename:'Player',id:'new-seat',name:'New pirate',isAutomated:false},
  ]);
  writePractice([]);
  expect(client.cache.readQuery({query:playerTable,variables})).toEqual(seatState([]));
});

test('practice player updates remain scoped to their viewer', () => {
  client.cache.writeQuery({query:playerTable,variables,data:seatState()});
  writePractice([{...seats[0],name:'Other viewer'}], {...variables,playerToken:''});
  expect(client.cache.readQuery({query:playerTable,variables})).toEqual(seatState());
});
