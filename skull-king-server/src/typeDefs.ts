const typeDefs = `#graphql
  type Query {
    players(gameId: String!): String!
    games: [String!]!
    state(gameId: String!, playerToken: String): GameState
  }

  input DeckConfigInput {
    includeMermaids: Boolean
    includeKraken: Boolean
    includeWhiteWhale: Boolean
    includeLoot: Boolean
  }

  type DeckConfig {
    includeMermaids: Boolean!
    includeKraken: Boolean!
    includeWhiteWhale: Boolean!
    includeLoot: Boolean!
  }

  type Mutation {
    newGame(deckConfig: DeckConfigInput): String!
    startGame(gameId: String!): Boolean!
    addPlayer(gameId: String!, name: String!): String!
    submitBid(gameId: String!, playerToken: String!, count: Int!): Boolean!
    playColoredCard(
      gameId: String!
      playerToken: String!
      cardId: String!
    ): Boolean!
    playSpecialCard(
      gameId: String!
      playerToken: String!
      cardId: String!
      selection: String
    ): Boolean!
    advanceTrick(gameId: String!): Boolean!
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
    currentRound: Round!
    # deck: Deck!
    scorecard: [[ScoreBlock!]!]
    deckConfig: DeckConfig!
  }

  type Player {
    id: String!
    name: String!
    hand: [Card!]!
  }

  union Card = SpecialCard | ColoredCard

  type SpecialCard {
    id: String!
    type: String!
    selection: String
  }

  type ColoredCard {
    id: String!
    color: String!
    number: Int!
  }

  type Round {
    id: Int!
    roundNumber: Int!
    phase: String!
    leader: String!
    playerTurn: String!
    myBid: Int
    trickColor: Color
    cardsPlayed: [PlayedCard!]!
    hands: [Hand!]!
    lastCompletedHand: Hand
  }

  type Hand {
    id: String!
    trickColor: Color
    cardsPlayed: [PlayedCard!]!
    winningCard: PlayedCard
    trickDiscarded: Boolean
  }

  type PlayedCard {
    id: String!
    playerId: String!
    card: Card!
  }

  enum Color {
    YELLOW
    GREEN
    PURPLE
    BLACK
  }

  type ScoreBlock {
    playerName: String!
    tricksBid: Int!
    tricksWon: Int!
    bidPoints: Int!
    bonusPoints: Int!
    totalPoints: Int!
  }
`;

export default typeDefs;
