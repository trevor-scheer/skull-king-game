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
`;

export default typeDefs;
