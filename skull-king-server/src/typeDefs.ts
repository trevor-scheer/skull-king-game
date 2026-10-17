import { pirateAbilityTypeDefs } from "./pirateAbilityTypeDefs";

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
    includeExpansion: Boolean
    includeFirstMate: Boolean
    includeStingray: Boolean
    includeDavyJones: Boolean
    includeWalkThePlank: Boolean
    includeLastVolley: Boolean
  }

  type DeckConfig {
    includeMermaids: Boolean!
    includeKraken: Boolean!
    includeWhiteWhale: Boolean!
    includeLoot: Boolean!
    includeExpansion: Boolean!
    includeFirstMate: Boolean!
    includeStingray: Boolean!
    includeDavyJones: Boolean!
    includeWalkThePlank: Boolean!
    includeLastVolley: Boolean!
  }

  type Mutation {
    newGame(deckConfig: DeckConfigInput, scoringMode: ScoringMode, pirateAbilities: Boolean, roundSchedule: [Int!], tieBreakers: Boolean, cannonball: Boolean): String!
    rematchGame(gameId: String!, playerToken: String!): String!
    startGame(gameId: String!, playerToken: String!): Boolean!
    addBot(gameId: String!, playerToken: String!): String!
    removeBot(gameId: String!, playerToken: String!, playerId: String!): Boolean!
    setAutoplay(gameId: String!, playerToken: String!, enabled: Boolean!): Boolean!
    enableAwayAutoplay(gameId: String!, playerToken: String!, playerId: String!, expectedLastSeenAt: Float!): Boolean!
    leaveGame(gameId: String!, playerToken: String!): Boolean!
    addPlayer(gameId: String!, name: String!): String!
    submitBid(gameId: String!, playerToken: String!, count: Int!): Boolean!
    loadCannon(gameId: String!, playerToken: String!, load: CannonLoad!, expectedRoundNumber: Int!): Boolean!
    playColoredCard(
      gameId: String!
      playerToken: String!
      cardId: String!
      numberChoice: Int
      colorChoice: Color
    ): Boolean!
    playSpecialCard(
      gameId: String!
      playerToken: String!
      cardId: String!
      selection: String
    ): Boolean!
    advanceTrick(gameId: String!, playerToken: String!, expectedHandId: String!): Boolean!
    choosePlankTarget(gameId: String!, playerToken: String!, expectedChoiceId: String!, cardId: String!): Boolean!
    usePirateAbility(gameId: String!, playerToken: String!, expectedAbilityId: String!, input: PirateAbilityInput!): Boolean!
  }

  type GameState {
    id: String!
    practice: Boolean!
    nextGameId: String
    phase: String!
    me: Player
    players: [Player!]!
    currentRound: Round
    # deck: Deck!
    scorecard: [[ScoreBlock!]!]
    deckConfig: DeckConfig!
    scoringMode: ScoringMode!
    pirateAbilities: Boolean!
    roundSchedule: [Int!]!
    tieBreakers: Boolean!
    cannonball: Boolean!
    maxPlayers: Int!
    legalCardIds: [String!]!
  }

  enum ScoringMode {
    classic
    rascal
  }

  enum CannonLoad {
    grapeshot
    cannonball
  }

  type RevealedBid { playerId: String! count: Int! }
  type RevealedCannonLoad { playerId: String! load: CannonLoad! }

  type Player {
    id: String!
    name: String!
    hand: [Card!]!
    handCount: Int!
    isAutomated: Boolean!
    isBot: Boolean!
    isAutoplay: Boolean!
    lastSeenAt: Float
    bid: Int
    tricksWon: Int!
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
    expansion: Boolean
    choice: Boolean
    wild: Boolean
  }

  type Round {
    id: Int!
    roundNumber: Int!
    cardsPerPlayer: Int!
    isTieBreaker: Boolean!
    myCannonLoad: CannonLoad
    revealedBids: [RevealedBid!]!
    revealedCannonLoads: [RevealedCannonLoad!]!
    phase: String!
    leader: String!
    playerTurn: String
    myBid: Int
    bidRevealEndsAt: Float
    trickColor: Color
    cardsPlayed: [PlayedCard!]!
    hands: [Hand!]!
    lastCompletedHand: Hand
    pirateAbility: PirateAbility
    plankChoice: PlankChoice
    myForcedCardId: String
  }

  type PlankChoice {
    id: String!
    playerId: String!
    cardIds: [String!]!
  }

  type Hand {
    id: String!
    trickColor: Color
    cardsPlayed: [PlayedCard!]!
    winningCard: PlayedCard
    trickDiscarded: Boolean
    removedCardIds: [String!]
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
${pirateAbilityTypeDefs}
`;

export default typeDefs;
