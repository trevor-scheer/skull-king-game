import { client } from "../client";
import { GameStateDocument, GameStateQuery, ScoringMode } from "../types/graphqlTypes";

test("caches a completed trick from the game-state polling query", () => {
  client.cache.restore({});
  const variables = { gameId: "game-1", playerToken: "player-token" };
  const data: GameStateQuery = {
    state: {
      __typename: "GameState",
      id: variables.gameId,
      scoringMode: ScoringMode.Classic, pirateAbilities: false, cannonball: false,
      deckConfig: {__typename:"DeckConfig", includeMermaids:true, includeKraken:false,includeWhiteWhale:false,includeLoot:false,includeExpansion:false,includeFirstMate:false,includeStingray:false,includeDavyJones:false,includeWalkThePlank:false,includeLastVolley:false},
      legalCardIds: [],
      players: [
        { __typename: "Player", id: "Anne", name: "Anne", handCount: 0, isAutomated: false, bid: 0, tricksWon: 0 },
        { __typename: "Player", id: "Mary", name: "Mary", handCount: 0, isAutomated: false, bid: 1, tricksWon: 1 },
      ],
      me: { __typename: "Player", id: "Anne", name: "Anne", handCount: 0, isAutomated: false, bid: 0, tricksWon: 0 },
      currentRound: {
        __typename: "Round",
        id: 1,
        roundNumber: 1,
        cardsPerPlayer: 1, isTieBreaker:false, trickColor:null, hands:[], lastCompletedHand:null, plankChoice:null,
        phase: "trick_result",
        pirateAbility: null,
        leader: "Mary",
        playerTurn: null,
        myBid: 0,
        cardsPlayed: [
          { __typename: "PlayedCard", id: "Anne-yellow-1", playerId: "Anne" },
          { __typename: "PlayedCard", id: "Mary-yellow-2", playerId: "Mary" },
        ],
      },
    },
  };

  expect(() =>
    client.cache.writeQuery({ query: GameStateDocument, variables, data })
  ).not.toThrow();
  expect(
    client.cache.readQuery<GameStateQuery>({ query: GameStateDocument, variables })
  ).toEqual(data);
});

test("room and historical card snapshots cannot overwrite another room", () => {
  const { gql } = require('@apollo/client');
  const query = gql`query Room($id:String!) { state(gameId:$id) { id players { id name } currentRound { id phase cardsPlayed { id card { ... on SpecialCard { id type selection } } } } } }`;
  const room = (id:string, name:string, phase:string, selection:string) => ({state:{__typename:'GameState',id,players:[{__typename:'Player',id:'same-player',name}],currentRound:{__typename:'Round',id:1,phase,cardsPlayed:[{__typename:'PlayedCard',id:'same-card',card:{__typename:'SpecialCard',id:'tigress',type:'tigress',selection}}]}}});
  client.cache.restore({});
  const first = room('one','Anne','play','escape');
  client.cache.writeQuery({query,variables:{id:'one'},data:first});
  client.cache.writeQuery({query,variables:{id:'two'},data:room('two','Mary','bid','pirate')});
  expect(client.cache.readQuery({query,variables:{id:'one'}})).toEqual(first);
});
