import { gql } from "apollo-server-core";

const typeDefs = gql`
  type Query {
    players(gameId: Int!): String!
  }

  type Mutation {
    newGame: Int!
    startGame(gameId: Int!): Boolean!
    addPlayer(gameId: Int!, name: String!): Boolean!
    submitBid(gameId: Int!, playerId: String!, count: Int!): Boolean!
    playColoredCard(
      gameId: Int!
      playerId: String!
      color: String!
      number: Int!
    ): Boolean!
    playSpecialCard(
      gameId: Int!
      playerId: String!
      card: String!
      selection: String
    ): Boolean!
  }

  type Subscription {
    hello: String
    state(id: Int!): GameState
  }

  type GameState {
    phase: String!
    players: [Player!]!
    currentRound: CurrentRound!
    # deck: Deck!
    # scorecard: Scorecard
  }

  type Player {
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
    # TODO
  }
`;

export default typeDefs;
