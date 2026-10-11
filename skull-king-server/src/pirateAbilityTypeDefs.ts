export const pirateAbilityTypeDefs = `#graphql
  enum PirateAbilityAction {
    decline
    chooseLeader
    wager
    draw
    discard
    reveal
    finish
    forceCard
    adjustBid
  }

  input PirateAbilityInput {
    action: PirateAbilityAction!
    playerId: String
    cardIds: [String!]
    amount: Int
  }

  type PirateAbility {
    id: String!
    pirateId: String!
    name: String!
    kind: String!
    playerId: String!
    stage: String!
    canDecline: Boolean!
    privateCards: [Card!]!
  }
`;
