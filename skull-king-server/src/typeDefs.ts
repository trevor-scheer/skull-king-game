import { gql } from "apollo-server-core";

const typeDefs = gql`
  type Query {
    players(gameId: String!): String!
    games: [String!]!
    state(gameId: String!, playerToken: String): GameState
  }

  type Mutation {
    newGame: String!
    startGame(gameId: String!): Boolean!
    addPlayer(gameId: String!, name: String!): String!
    submitBid(gameId: String!, playerToken: String!, count: Int!): Boolean!
    playColoredCard(
      gameId: String!
      playerToken: String!
      color: String!
      number: Int!
    ): Boolean!
    playSpecialCard(
      gameId: String!
      playerToken: String!
      card: String!
      selection: String
    ): Boolean!
  }

  type Subscription {
    hello: String
    state(gameId: String!, playerToken: String): GameState
  }

  type GameState {
    id: String!
    phase: String!
    me: Player
    players: [Player!]!
    currentRound: CurrentRound!
    # deck: Deck!
    # scorecard: Scorecard
  }

  type Player {
    id: String!
    name: String!
    hand: [Card!]!
  }

  union Card = SpecialCard | ColoredCard

  type SpecialCard {
    type: String!
    selection: String
  }

  type ColoredCard {
    color: String!
    number: Int!
  }

  type CurrentRound {
    roundNumber: Int!
    phase: String!
    leader: String
  }
`;

export default typeDefs;
