import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export enum CannonLoad {
  Cannonball = 'cannonball',
  Grapeshot = 'grapeshot'
}

export type Card = ColoredCard | SpecialCard;

export enum Color {
  Black = 'BLACK',
  Green = 'GREEN',
  Purple = 'PURPLE',
  Yellow = 'YELLOW'
}

export type ColoredCard = {
  __typename?: 'ColoredCard';
  color: Scalars['String']['output'];
  id: Scalars['String']['output'];
  number: Scalars['Int']['output'];
};

export type DeckConfig = {
  __typename?: 'DeckConfig';
  includeKraken: Scalars['Boolean']['output'];
  includeLoot: Scalars['Boolean']['output'];
  includeMermaids: Scalars['Boolean']['output'];
  includeWhiteWhale: Scalars['Boolean']['output'];
};

export type DeckConfigInput = {
  includeKraken?: InputMaybe<Scalars['Boolean']['input']>;
  includeLoot?: InputMaybe<Scalars['Boolean']['input']>;
  includeMermaids?: InputMaybe<Scalars['Boolean']['input']>;
  includeWhiteWhale?: InputMaybe<Scalars['Boolean']['input']>;
};

export type GameState = {
  __typename?: 'GameState';
  cannonball: Scalars['Boolean']['output'];
  currentRound?: Maybe<Round>;
  deckConfig: DeckConfig;
  id: Scalars['String']['output'];
  legalCardIds: Array<Scalars['String']['output']>;
  maxPlayers: Scalars['Int']['output'];
  me?: Maybe<Player>;
  phase: Scalars['String']['output'];
  pirateAbilities: Scalars['Boolean']['output'];
  players: Array<Player>;
  roundSchedule: Array<Scalars['Int']['output']>;
  scorecard?: Maybe<Array<Array<ScoreBlock>>>;
  scoringMode: ScoringMode;
  tieBreakers: Scalars['Boolean']['output'];
};

export type Hand = {
  __typename?: 'Hand';
  cardsPlayed: Array<PlayedCard>;
  id: Scalars['String']['output'];
  trickColor?: Maybe<Color>;
  trickDiscarded?: Maybe<Scalars['Boolean']['output']>;
  winningCard?: Maybe<PlayedCard>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addPlayer: Scalars['String']['output'];
  advanceTrick: Scalars['Boolean']['output'];
  loadCannon: Scalars['Boolean']['output'];
  newGame: Scalars['String']['output'];
  playColoredCard: Scalars['Boolean']['output'];
  playSpecialCard: Scalars['Boolean']['output'];
  startGame: Scalars['Boolean']['output'];
  submitBid: Scalars['Boolean']['output'];
  usePirateAbility: Scalars['Boolean']['output'];
};


export type MutationAddPlayerArgs = {
  gameId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};


export type MutationAdvanceTrickArgs = {
  expectedHandId: Scalars['String']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationLoadCannonArgs = {
  expectedRoundNumber: Scalars['Int']['input'];
  gameId: Scalars['String']['input'];
  load: CannonLoad;
  playerToken: Scalars['String']['input'];
};


export type MutationNewGameArgs = {
  cannonball?: InputMaybe<Scalars['Boolean']['input']>;
  deckConfig?: InputMaybe<DeckConfigInput>;
  pirateAbilities?: InputMaybe<Scalars['Boolean']['input']>;
  roundSchedule?: InputMaybe<Array<Scalars['Int']['input']>>;
  scoringMode?: InputMaybe<ScoringMode>;
  tieBreakers?: InputMaybe<Scalars['Boolean']['input']>;
};


export type MutationPlayColoredCardArgs = {
  cardId: Scalars['String']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationPlaySpecialCardArgs = {
  cardId: Scalars['String']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  selection?: InputMaybe<Scalars['String']['input']>;
};


export type MutationStartGameArgs = {
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationSubmitBidArgs = {
  count: Scalars['Int']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationUsePirateAbilityArgs = {
  expectedAbilityId: Scalars['String']['input'];
  gameId: Scalars['String']['input'];
  input: PirateAbilityInput;
  playerToken: Scalars['String']['input'];
};

export type PirateAbility = {
  __typename?: 'PirateAbility';
  id: Scalars['String']['output'];
  kind: Scalars['String']['output'];
  name: Scalars['String']['output'];
  pirateId: Scalars['String']['output'];
  playerId: Scalars['String']['output'];
  privateCards: Array<Card>;
  stage: Scalars['String']['output'];
};

export enum PirateAbilityAction {
  AdjustBid = 'adjustBid',
  ChooseLeader = 'chooseLeader',
  Decline = 'decline',
  Discard = 'discard',
  Draw = 'draw',
  Finish = 'finish',
  Reveal = 'reveal',
  Wager = 'wager'
}

export type PirateAbilityInput = {
  action: PirateAbilityAction;
  amount?: InputMaybe<Scalars['Int']['input']>;
  cardIds?: InputMaybe<Array<Scalars['String']['input']>>;
  playerId?: InputMaybe<Scalars['String']['input']>;
};

export type PlayedCard = {
  __typename?: 'PlayedCard';
  card: Card;
  id: Scalars['String']['output'];
  playerId: Scalars['String']['output'];
};

export type Player = {
  __typename?: 'Player';
  bid?: Maybe<Scalars['Int']['output']>;
  hand: Array<Card>;
  handCount: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  isAutomated: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  tricksWon: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  games: Array<Scalars['String']['output']>;
  players: Scalars['String']['output'];
  state?: Maybe<GameState>;
};


export type QueryPlayersArgs = {
  gameId: Scalars['String']['input'];
};


export type QueryStateArgs = {
  gameId: Scalars['String']['input'];
  playerToken?: InputMaybe<Scalars['String']['input']>;
};

export type RevealedBid = {
  __typename?: 'RevealedBid';
  count: Scalars['Int']['output'];
  playerId: Scalars['String']['output'];
};

export type RevealedCannonLoad = {
  __typename?: 'RevealedCannonLoad';
  load: CannonLoad;
  playerId: Scalars['String']['output'];
};

export type Round = {
  __typename?: 'Round';
  cardsPerPlayer: Scalars['Int']['output'];
  cardsPlayed: Array<PlayedCard>;
  hands: Array<Hand>;
  id: Scalars['Int']['output'];
  isTieBreaker: Scalars['Boolean']['output'];
  lastCompletedHand?: Maybe<Hand>;
  leader: Scalars['String']['output'];
  myBid?: Maybe<Scalars['Int']['output']>;
  myCannonLoad?: Maybe<CannonLoad>;
  phase: Scalars['String']['output'];
  pirateAbility?: Maybe<PirateAbility>;
  playerTurn?: Maybe<Scalars['String']['output']>;
  revealedBids: Array<RevealedBid>;
  revealedCannonLoads: Array<RevealedCannonLoad>;
  roundNumber: Scalars['Int']['output'];
  trickColor?: Maybe<Color>;
};

export type ScoreBlock = {
  __typename?: 'ScoreBlock';
  bidPoints: Scalars['Int']['output'];
  bonusPoints: Scalars['Int']['output'];
  playerName: Scalars['String']['output'];
  totalPoints: Scalars['Int']['output'];
  tricksBid: Scalars['Int']['output'];
  tricksWon: Scalars['Int']['output'];
};

export enum ScoringMode {
  Classic = 'classic',
  Rascal = 'rascal'
}

export type SpecialCard = {
  __typename?: 'SpecialCard';
  id: Scalars['String']['output'];
  selection?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type GamePhaseQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
}>;


export type GamePhaseQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, phase: string } | null };

export type RoundNumberQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type RoundNumberQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, currentRound?: { __typename?: 'Round', id: number, roundNumber: number } | null } | null };

export type SubmitBidMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  count: Scalars['Int']['input'];
}>;


export type SubmitBidMutation = { __typename?: 'Mutation', submitBid: boolean };

export type GameStateQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type GameStateQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, legalCardIds: Array<string>, players: Array<{ __typename?: 'Player', id: string, name: string, handCount: number, isAutomated: boolean, bid?: number | null, tricksWon: number }>, me?: { __typename?: 'Player', id: string, name: string, handCount: number, isAutomated: boolean, bid?: number | null, tricksWon: number } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, leader: string, playerTurn?: string | null, myBid?: number | null, roundNumber: number, pirateAbility?: { __typename?: 'PirateAbility', id: string } | null, cardsPlayed: Array<{ __typename?: 'PlayedCard', id: string, playerId: string }> } | null } | null };

export type MyHandQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type MyHandQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, me?: { __typename?: 'Player', id: string, name: string, hand: Array<{ __typename?: 'ColoredCard', id: string, color: string, number: number } | { __typename?: 'SpecialCard', id: string, type: string }> } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, playerTurn?: string | null, trickColor?: Color | null, myBid?: number | null } | null } | null };

export type PlayColoredCardMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  cardId: Scalars['String']['input'];
}>;


export type PlayColoredCardMutation = { __typename?: 'Mutation', playColoredCard: boolean };

export type PlaySpecialCardMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  cardId: Scalars['String']['input'];
  selection?: InputMaybe<Scalars['String']['input']>;
}>;


export type PlaySpecialCardMutation = { __typename?: 'Mutation', playSpecialCard: boolean };

export type PirateAbilityStateQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type PirateAbilityStateQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, phase: string, players: Array<{ __typename?: 'Player', id: string, name: string }>, me?: { __typename?: 'Player', id: string, hand: Array<{ __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null }> } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, roundNumber: number, myBid?: number | null, leader: string, playerTurn?: string | null, pirateAbility?: { __typename?: 'PirateAbility', id: string, pirateId: string, name: string, kind: string, playerId: string, stage: string, privateCards: Array<{ __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null }> } | null } | null } | null };

export type ResolvePirateAbilityMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  expectedAbilityId: Scalars['String']['input'];
  input: PirateAbilityInput;
}>;


export type ResolvePirateAbilityMutation = { __typename?: 'Mutation', usePirateAbility: boolean };

export type CardsPlayedQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type CardsPlayedQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, currentRound?: { __typename?: 'Round', id: number, phase: string, cardsPlayed: Array<{ __typename?: 'PlayedCard', id: string, playerId: string, card: { __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null } }> } | null } | null };

export type PreviousHandQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type PreviousHandQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, currentRound?: { __typename?: 'Round', id: number, hands: Array<{ __typename?: 'Hand', id: string, trickColor?: Color | null, cardsPlayed: Array<{ __typename?: 'PlayedCard', id: string, playerId: string, card: { __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null } }>, winningCard?: { __typename?: 'PlayedCard', playerId: string, card: { __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null } } | null }> } | null } | null };

type CardFragment_ColoredCard_Fragment = { __typename: 'ColoredCard', id: string, color: string, number: number };

type CardFragment_SpecialCard_Fragment = { __typename: 'SpecialCard', id: string, type: string, selection?: string | null };

export type CardFragmentFragment = CardFragment_ColoredCard_Fragment | CardFragment_SpecialCard_Fragment;

export type ScorecardQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type ScorecardQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, me?: { __typename?: 'Player', id: string, name: string } | null, scorecard?: Array<Array<{ __typename?: 'ScoreBlock', playerName: string, tricksBid: number, tricksWon: number, bidPoints: number, bonusPoints: number, totalPoints: number }>> | null } | null };

export type AdvanceTrickMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  expectedHandId: Scalars['String']['input'];
}>;


export type AdvanceTrickMutation = { __typename?: 'Mutation', advanceTrick: boolean };

export type TrickResultDataQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type TrickResultDataQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, phase: string, currentRound?: { __typename?: 'Round', id: number, phase: string, roundNumber: number, leader: string, playerTurn?: string | null, myBid?: number | null, trickColor?: Color | null, pirateAbility?: { __typename?: 'PirateAbility', id: string } | null, cardsPlayed: Array<{ __typename?: 'PlayedCard', id: string, playerId: string }>, lastCompletedHand?: { __typename?: 'Hand', id: string, cardsPlayed: Array<{ __typename?: 'PlayedCard', id: string, playerId: string, card: { __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null } }>, winningCard?: { __typename?: 'PlayedCard', id: string, playerId: string, card: { __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null } } | null } | null } | null } | null };

export type AddPlayerMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  name: Scalars['String']['input'];
}>;


export type AddPlayerMutation = { __typename?: 'Mutation', addPlayer: string };

export type LobbyQueryQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type LobbyQueryQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, scoringMode: ScoringMode, pirateAbilities: boolean, deckConfig: { __typename?: 'DeckConfig', includeMermaids: boolean, includeKraken: boolean, includeWhiteWhale: boolean, includeLoot: boolean }, players: Array<{ __typename?: 'Player', id: string, name: string }> } | null };

export type PlayersQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
}>;


export type PlayersQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, players: Array<{ __typename?: 'Player', id: string, name: string }> } | null };

export type StartGameMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type StartGameMutation = { __typename?: 'Mutation', startGame: boolean };

export type GamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GamesQuery = { __typename?: 'Query', games: Array<string> };

export type NewGameMutationVariables = Exact<{
  deckConfig?: InputMaybe<DeckConfigInput>;
  pirateAbilities?: InputMaybe<Scalars['Boolean']['input']>;
  scoringMode?: InputMaybe<ScoringMode>;
}>;


export type NewGameMutation = { __typename?: 'Mutation', newGame: string };

export const CardFragmentFragmentDoc = gql`
    fragment CardFragment on Card {
  __typename
  ... on SpecialCard {
    id
    type
    selection
  }
  ... on ColoredCard {
    id
    color
    number
  }
}
    `;
export const GamePhaseDocument = gql`
    query GamePhase($gameId: String!) {
  state(gameId: $gameId) {
    id
    phase
  }
}
    `;

/**
 * __useGamePhaseQuery__
 *
 * To run a query within a React component, call `useGamePhaseQuery` and pass it any options that fit your needs.
 * When your component renders, `useGamePhaseQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGamePhaseQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *   },
 * });
 */
export function useGamePhaseQuery(baseOptions: Apollo.QueryHookOptions<GamePhaseQuery, GamePhaseQueryVariables> & ({ variables: GamePhaseQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GamePhaseQuery, GamePhaseQueryVariables>(GamePhaseDocument, options);
      }
export function useGamePhaseLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GamePhaseQuery, GamePhaseQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GamePhaseQuery, GamePhaseQueryVariables>(GamePhaseDocument, options);
        }
// @ts-ignore
export function useGamePhaseSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GamePhaseQuery, GamePhaseQueryVariables>): Apollo.UseSuspenseQueryResult<GamePhaseQuery, GamePhaseQueryVariables>;
export function useGamePhaseSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamePhaseQuery, GamePhaseQueryVariables>): Apollo.UseSuspenseQueryResult<GamePhaseQuery | undefined, GamePhaseQueryVariables>;
export function useGamePhaseSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamePhaseQuery, GamePhaseQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GamePhaseQuery, GamePhaseQueryVariables>(GamePhaseDocument, options);
        }
export type GamePhaseQueryHookResult = ReturnType<typeof useGamePhaseQuery>;
export type GamePhaseLazyQueryHookResult = ReturnType<typeof useGamePhaseLazyQuery>;
export type GamePhaseSuspenseQueryHookResult = ReturnType<typeof useGamePhaseSuspenseQuery>;
export type GamePhaseQueryResult = Apollo.QueryResult<GamePhaseQuery, GamePhaseQueryVariables>;
export const RoundNumberDocument = gql`
    query RoundNumber($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    currentRound {
      id
      roundNumber
    }
  }
}
    `;

/**
 * __useRoundNumberQuery__
 *
 * To run a query within a React component, call `useRoundNumberQuery` and pass it any options that fit your needs.
 * When your component renders, `useRoundNumberQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRoundNumberQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useRoundNumberQuery(baseOptions: Apollo.QueryHookOptions<RoundNumberQuery, RoundNumberQueryVariables> & ({ variables: RoundNumberQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RoundNumberQuery, RoundNumberQueryVariables>(RoundNumberDocument, options);
      }
export function useRoundNumberLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RoundNumberQuery, RoundNumberQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RoundNumberQuery, RoundNumberQueryVariables>(RoundNumberDocument, options);
        }
// @ts-ignore
export function useRoundNumberSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<RoundNumberQuery, RoundNumberQueryVariables>): Apollo.UseSuspenseQueryResult<RoundNumberQuery, RoundNumberQueryVariables>;
export function useRoundNumberSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RoundNumberQuery, RoundNumberQueryVariables>): Apollo.UseSuspenseQueryResult<RoundNumberQuery | undefined, RoundNumberQueryVariables>;
export function useRoundNumberSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RoundNumberQuery, RoundNumberQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RoundNumberQuery, RoundNumberQueryVariables>(RoundNumberDocument, options);
        }
export type RoundNumberQueryHookResult = ReturnType<typeof useRoundNumberQuery>;
export type RoundNumberLazyQueryHookResult = ReturnType<typeof useRoundNumberLazyQuery>;
export type RoundNumberSuspenseQueryHookResult = ReturnType<typeof useRoundNumberSuspenseQuery>;
export type RoundNumberQueryResult = Apollo.QueryResult<RoundNumberQuery, RoundNumberQueryVariables>;
export const SubmitBidDocument = gql`
    mutation SubmitBid($gameId: String!, $playerToken: String!, $count: Int!) {
  submitBid(gameId: $gameId, playerToken: $playerToken, count: $count)
}
    `;
export type SubmitBidMutationFn = Apollo.MutationFunction<SubmitBidMutation, SubmitBidMutationVariables>;

/**
 * __useSubmitBidMutation__
 *
 * To run a mutation, you first call `useSubmitBidMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitBidMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitBidMutation, { data, loading, error }] = useSubmitBidMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      count: // value for 'count'
 *   },
 * });
 */
export function useSubmitBidMutation(baseOptions?: Apollo.MutationHookOptions<SubmitBidMutation, SubmitBidMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SubmitBidMutation, SubmitBidMutationVariables>(SubmitBidDocument, options);
      }
export type SubmitBidMutationHookResult = ReturnType<typeof useSubmitBidMutation>;
export type SubmitBidMutationResult = Apollo.MutationResult<SubmitBidMutation>;
export type SubmitBidMutationOptions = Apollo.BaseMutationOptions<SubmitBidMutation, SubmitBidMutationVariables>;
export const GameStateDocument = gql`
    query GameState($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    legalCardIds
    players {
      id
      name
      handCount
      isAutomated
      bid
      tricksWon
    }
    me {
      id
      name
      handCount
      isAutomated
      bid
      tricksWon
    }
    currentRound {
      id
      phase
      pirateAbility {
        id
      }
      leader
      playerTurn
      myBid
      roundNumber
      cardsPlayed {
        id
        playerId
      }
    }
  }
}
    `;

/**
 * __useGameStateQuery__
 *
 * To run a query within a React component, call `useGameStateQuery` and pass it any options that fit your needs.
 * When your component renders, `useGameStateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGameStateQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useGameStateQuery(baseOptions: Apollo.QueryHookOptions<GameStateQuery, GameStateQueryVariables> & ({ variables: GameStateQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GameStateQuery, GameStateQueryVariables>(GameStateDocument, options);
      }
export function useGameStateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GameStateQuery, GameStateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GameStateQuery, GameStateQueryVariables>(GameStateDocument, options);
        }
// @ts-ignore
export function useGameStateSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GameStateQuery, GameStateQueryVariables>): Apollo.UseSuspenseQueryResult<GameStateQuery, GameStateQueryVariables>;
export function useGameStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GameStateQuery, GameStateQueryVariables>): Apollo.UseSuspenseQueryResult<GameStateQuery | undefined, GameStateQueryVariables>;
export function useGameStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GameStateQuery, GameStateQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GameStateQuery, GameStateQueryVariables>(GameStateDocument, options);
        }
export type GameStateQueryHookResult = ReturnType<typeof useGameStateQuery>;
export type GameStateLazyQueryHookResult = ReturnType<typeof useGameStateLazyQuery>;
export type GameStateSuspenseQueryHookResult = ReturnType<typeof useGameStateSuspenseQuery>;
export type GameStateQueryResult = Apollo.QueryResult<GameStateQuery, GameStateQueryVariables>;
export const MyHandDocument = gql`
    query MyHand($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    me {
      id
      name
      hand {
        ... on SpecialCard {
          id
          type
        }
        ... on ColoredCard {
          id
          color
          number
        }
      }
    }
    currentRound {
      id
      phase
      playerTurn
      trickColor
      myBid
    }
  }
}
    `;

/**
 * __useMyHandQuery__
 *
 * To run a query within a React component, call `useMyHandQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyHandQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyHandQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useMyHandQuery(baseOptions: Apollo.QueryHookOptions<MyHandQuery, MyHandQueryVariables> & ({ variables: MyHandQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyHandQuery, MyHandQueryVariables>(MyHandDocument, options);
      }
export function useMyHandLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyHandQuery, MyHandQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyHandQuery, MyHandQueryVariables>(MyHandDocument, options);
        }
// @ts-ignore
export function useMyHandSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<MyHandQuery, MyHandQueryVariables>): Apollo.UseSuspenseQueryResult<MyHandQuery, MyHandQueryVariables>;
export function useMyHandSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyHandQuery, MyHandQueryVariables>): Apollo.UseSuspenseQueryResult<MyHandQuery | undefined, MyHandQueryVariables>;
export function useMyHandSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<MyHandQuery, MyHandQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<MyHandQuery, MyHandQueryVariables>(MyHandDocument, options);
        }
export type MyHandQueryHookResult = ReturnType<typeof useMyHandQuery>;
export type MyHandLazyQueryHookResult = ReturnType<typeof useMyHandLazyQuery>;
export type MyHandSuspenseQueryHookResult = ReturnType<typeof useMyHandSuspenseQuery>;
export type MyHandQueryResult = Apollo.QueryResult<MyHandQuery, MyHandQueryVariables>;
export const PlayColoredCardDocument = gql`
    mutation PlayColoredCard($gameId: String!, $playerToken: String!, $cardId: String!) {
  playColoredCard(gameId: $gameId, playerToken: $playerToken, cardId: $cardId)
}
    `;
export type PlayColoredCardMutationFn = Apollo.MutationFunction<PlayColoredCardMutation, PlayColoredCardMutationVariables>;

/**
 * __usePlayColoredCardMutation__
 *
 * To run a mutation, you first call `usePlayColoredCardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePlayColoredCardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [playColoredCardMutation, { data, loading, error }] = usePlayColoredCardMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      cardId: // value for 'cardId'
 *   },
 * });
 */
export function usePlayColoredCardMutation(baseOptions?: Apollo.MutationHookOptions<PlayColoredCardMutation, PlayColoredCardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PlayColoredCardMutation, PlayColoredCardMutationVariables>(PlayColoredCardDocument, options);
      }
export type PlayColoredCardMutationHookResult = ReturnType<typeof usePlayColoredCardMutation>;
export type PlayColoredCardMutationResult = Apollo.MutationResult<PlayColoredCardMutation>;
export type PlayColoredCardMutationOptions = Apollo.BaseMutationOptions<PlayColoredCardMutation, PlayColoredCardMutationVariables>;
export const PlaySpecialCardDocument = gql`
    mutation PlaySpecialCard($gameId: String!, $playerToken: String!, $cardId: String!, $selection: String) {
  playSpecialCard(
    gameId: $gameId
    playerToken: $playerToken
    cardId: $cardId
    selection: $selection
  )
}
    `;
export type PlaySpecialCardMutationFn = Apollo.MutationFunction<PlaySpecialCardMutation, PlaySpecialCardMutationVariables>;

/**
 * __usePlaySpecialCardMutation__
 *
 * To run a mutation, you first call `usePlaySpecialCardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `usePlaySpecialCardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [playSpecialCardMutation, { data, loading, error }] = usePlaySpecialCardMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      cardId: // value for 'cardId'
 *      selection: // value for 'selection'
 *   },
 * });
 */
export function usePlaySpecialCardMutation(baseOptions?: Apollo.MutationHookOptions<PlaySpecialCardMutation, PlaySpecialCardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<PlaySpecialCardMutation, PlaySpecialCardMutationVariables>(PlaySpecialCardDocument, options);
      }
export type PlaySpecialCardMutationHookResult = ReturnType<typeof usePlaySpecialCardMutation>;
export type PlaySpecialCardMutationResult = Apollo.MutationResult<PlaySpecialCardMutation>;
export type PlaySpecialCardMutationOptions = Apollo.BaseMutationOptions<PlaySpecialCardMutation, PlaySpecialCardMutationVariables>;
export const PirateAbilityStateDocument = gql`
    query PirateAbilityState($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    phase
    players {
      id
      name
    }
    me {
      id
      hand {
        __typename
        ... on ColoredCard {
          id
          color
          number
        }
        ... on SpecialCard {
          id
          type
          selection
        }
      }
    }
    currentRound {
      id
      phase
      roundNumber
      myBid
      leader
      playerTurn
      pirateAbility {
        id
        pirateId
        name
        kind
        playerId
        stage
        privateCards {
          __typename
          ... on ColoredCard {
            id
            color
            number
          }
          ... on SpecialCard {
            id
            type
            selection
          }
        }
      }
    }
  }
}
    `;

/**
 * __usePirateAbilityStateQuery__
 *
 * To run a query within a React component, call `usePirateAbilityStateQuery` and pass it any options that fit your needs.
 * When your component renders, `usePirateAbilityStateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePirateAbilityStateQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function usePirateAbilityStateQuery(baseOptions: Apollo.QueryHookOptions<PirateAbilityStateQuery, PirateAbilityStateQueryVariables> & ({ variables: PirateAbilityStateQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>(PirateAbilityStateDocument, options);
      }
export function usePirateAbilityStateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>(PirateAbilityStateDocument, options);
        }
// @ts-ignore
export function usePirateAbilityStateSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>): Apollo.UseSuspenseQueryResult<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>;
export function usePirateAbilityStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>): Apollo.UseSuspenseQueryResult<PirateAbilityStateQuery | undefined, PirateAbilityStateQueryVariables>;
export function usePirateAbilityStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>(PirateAbilityStateDocument, options);
        }
export type PirateAbilityStateQueryHookResult = ReturnType<typeof usePirateAbilityStateQuery>;
export type PirateAbilityStateLazyQueryHookResult = ReturnType<typeof usePirateAbilityStateLazyQuery>;
export type PirateAbilityStateSuspenseQueryHookResult = ReturnType<typeof usePirateAbilityStateSuspenseQuery>;
export type PirateAbilityStateQueryResult = Apollo.QueryResult<PirateAbilityStateQuery, PirateAbilityStateQueryVariables>;
export const ResolvePirateAbilityDocument = gql`
    mutation ResolvePirateAbility($gameId: String!, $playerToken: String!, $expectedAbilityId: String!, $input: PirateAbilityInput!) {
  usePirateAbility(
    gameId: $gameId
    playerToken: $playerToken
    expectedAbilityId: $expectedAbilityId
    input: $input
  )
}
    `;
export type ResolvePirateAbilityMutationFn = Apollo.MutationFunction<ResolvePirateAbilityMutation, ResolvePirateAbilityMutationVariables>;

/**
 * __useResolvePirateAbilityMutation__
 *
 * To run a mutation, you first call `useResolvePirateAbilityMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResolvePirateAbilityMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resolvePirateAbilityMutation, { data, loading, error }] = useResolvePirateAbilityMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      expectedAbilityId: // value for 'expectedAbilityId'
 *      input: // value for 'input'
 *   },
 * });
 */
export function useResolvePirateAbilityMutation(baseOptions?: Apollo.MutationHookOptions<ResolvePirateAbilityMutation, ResolvePirateAbilityMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ResolvePirateAbilityMutation, ResolvePirateAbilityMutationVariables>(ResolvePirateAbilityDocument, options);
      }
export type ResolvePirateAbilityMutationHookResult = ReturnType<typeof useResolvePirateAbilityMutation>;
export type ResolvePirateAbilityMutationResult = Apollo.MutationResult<ResolvePirateAbilityMutation>;
export type ResolvePirateAbilityMutationOptions = Apollo.BaseMutationOptions<ResolvePirateAbilityMutation, ResolvePirateAbilityMutationVariables>;
export const CardsPlayedDocument = gql`
    query CardsPlayed($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    currentRound {
      id
      phase
      cardsPlayed {
        id
        playerId
        card {
          __typename
          ... on SpecialCard {
            id
            type
            selection
          }
          ... on ColoredCard {
            id
            color
            number
          }
        }
      }
    }
  }
}
    `;

/**
 * __useCardsPlayedQuery__
 *
 * To run a query within a React component, call `useCardsPlayedQuery` and pass it any options that fit your needs.
 * When your component renders, `useCardsPlayedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCardsPlayedQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useCardsPlayedQuery(baseOptions: Apollo.QueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables> & ({ variables: CardsPlayedQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CardsPlayedQuery, CardsPlayedQueryVariables>(CardsPlayedDocument, options);
      }
export function useCardsPlayedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CardsPlayedQuery, CardsPlayedQueryVariables>(CardsPlayedDocument, options);
        }
// @ts-ignore
export function useCardsPlayedSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables>): Apollo.UseSuspenseQueryResult<CardsPlayedQuery, CardsPlayedQueryVariables>;
export function useCardsPlayedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables>): Apollo.UseSuspenseQueryResult<CardsPlayedQuery | undefined, CardsPlayedQueryVariables>;
export function useCardsPlayedSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CardsPlayedQuery, CardsPlayedQueryVariables>(CardsPlayedDocument, options);
        }
export type CardsPlayedQueryHookResult = ReturnType<typeof useCardsPlayedQuery>;
export type CardsPlayedLazyQueryHookResult = ReturnType<typeof useCardsPlayedLazyQuery>;
export type CardsPlayedSuspenseQueryHookResult = ReturnType<typeof useCardsPlayedSuspenseQuery>;
export type CardsPlayedQueryResult = Apollo.QueryResult<CardsPlayedQuery, CardsPlayedQueryVariables>;
export const PreviousHandDocument = gql`
    query PreviousHand($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    currentRound {
      id
      hands {
        id
        trickColor
        cardsPlayed {
          id
          playerId
          card {
            ...CardFragment
          }
        }
        winningCard {
          playerId
          card {
            ...CardFragment
          }
        }
      }
    }
  }
}
    ${CardFragmentFragmentDoc}`;

/**
 * __usePreviousHandQuery__
 *
 * To run a query within a React component, call `usePreviousHandQuery` and pass it any options that fit your needs.
 * When your component renders, `usePreviousHandQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePreviousHandQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function usePreviousHandQuery(baseOptions: Apollo.QueryHookOptions<PreviousHandQuery, PreviousHandQueryVariables> & ({ variables: PreviousHandQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PreviousHandQuery, PreviousHandQueryVariables>(PreviousHandDocument, options);
      }
export function usePreviousHandLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PreviousHandQuery, PreviousHandQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PreviousHandQuery, PreviousHandQueryVariables>(PreviousHandDocument, options);
        }
// @ts-ignore
export function usePreviousHandSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PreviousHandQuery, PreviousHandQueryVariables>): Apollo.UseSuspenseQueryResult<PreviousHandQuery, PreviousHandQueryVariables>;
export function usePreviousHandSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PreviousHandQuery, PreviousHandQueryVariables>): Apollo.UseSuspenseQueryResult<PreviousHandQuery | undefined, PreviousHandQueryVariables>;
export function usePreviousHandSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PreviousHandQuery, PreviousHandQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PreviousHandQuery, PreviousHandQueryVariables>(PreviousHandDocument, options);
        }
export type PreviousHandQueryHookResult = ReturnType<typeof usePreviousHandQuery>;
export type PreviousHandLazyQueryHookResult = ReturnType<typeof usePreviousHandLazyQuery>;
export type PreviousHandSuspenseQueryHookResult = ReturnType<typeof usePreviousHandSuspenseQuery>;
export type PreviousHandQueryResult = Apollo.QueryResult<PreviousHandQuery, PreviousHandQueryVariables>;
export const ScorecardDocument = gql`
    query Scorecard($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    me {
      id
      name
    }
    scorecard {
      playerName
      tricksBid
      tricksWon
      bidPoints
      bonusPoints
      totalPoints
    }
  }
}
    `;

/**
 * __useScorecardQuery__
 *
 * To run a query within a React component, call `useScorecardQuery` and pass it any options that fit your needs.
 * When your component renders, `useScorecardQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useScorecardQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useScorecardQuery(baseOptions: Apollo.QueryHookOptions<ScorecardQuery, ScorecardQueryVariables> & ({ variables: ScorecardQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ScorecardQuery, ScorecardQueryVariables>(ScorecardDocument, options);
      }
export function useScorecardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ScorecardQuery, ScorecardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ScorecardQuery, ScorecardQueryVariables>(ScorecardDocument, options);
        }
// @ts-ignore
export function useScorecardSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<ScorecardQuery, ScorecardQueryVariables>): Apollo.UseSuspenseQueryResult<ScorecardQuery, ScorecardQueryVariables>;
export function useScorecardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ScorecardQuery, ScorecardQueryVariables>): Apollo.UseSuspenseQueryResult<ScorecardQuery | undefined, ScorecardQueryVariables>;
export function useScorecardSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<ScorecardQuery, ScorecardQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<ScorecardQuery, ScorecardQueryVariables>(ScorecardDocument, options);
        }
export type ScorecardQueryHookResult = ReturnType<typeof useScorecardQuery>;
export type ScorecardLazyQueryHookResult = ReturnType<typeof useScorecardLazyQuery>;
export type ScorecardSuspenseQueryHookResult = ReturnType<typeof useScorecardSuspenseQuery>;
export type ScorecardQueryResult = Apollo.QueryResult<ScorecardQuery, ScorecardQueryVariables>;
export const AdvanceTrickDocument = gql`
    mutation AdvanceTrick($gameId: String!, $playerToken: String!, $expectedHandId: String!) {
  advanceTrick(
    gameId: $gameId
    playerToken: $playerToken
    expectedHandId: $expectedHandId
  )
}
    `;
export type AdvanceTrickMutationFn = Apollo.MutationFunction<AdvanceTrickMutation, AdvanceTrickMutationVariables>;

/**
 * __useAdvanceTrickMutation__
 *
 * To run a mutation, you first call `useAdvanceTrickMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAdvanceTrickMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [advanceTrickMutation, { data, loading, error }] = useAdvanceTrickMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      expectedHandId: // value for 'expectedHandId'
 *   },
 * });
 */
export function useAdvanceTrickMutation(baseOptions?: Apollo.MutationHookOptions<AdvanceTrickMutation, AdvanceTrickMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AdvanceTrickMutation, AdvanceTrickMutationVariables>(AdvanceTrickDocument, options);
      }
export type AdvanceTrickMutationHookResult = ReturnType<typeof useAdvanceTrickMutation>;
export type AdvanceTrickMutationResult = Apollo.MutationResult<AdvanceTrickMutation>;
export type AdvanceTrickMutationOptions = Apollo.BaseMutationOptions<AdvanceTrickMutation, AdvanceTrickMutationVariables>;
export const TrickResultDataDocument = gql`
    query TrickResultData($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    phase
    currentRound {
      id
      phase
      pirateAbility {
        id
      }
      roundNumber
      leader
      playerTurn
      myBid
      trickColor
      cardsPlayed {
        id
        playerId
      }
      lastCompletedHand {
        id
        cardsPlayed {
          id
          playerId
          card {
            __typename
            ... on SpecialCard {
              id
              type
              selection
            }
            ... on ColoredCard {
              id
              color
              number
            }
          }
        }
        winningCard {
          id
          playerId
          card {
            __typename
            ... on SpecialCard {
              id
              type
              selection
            }
            ... on ColoredCard {
              id
              color
              number
            }
          }
        }
      }
    }
  }
}
    `;

/**
 * __useTrickResultDataQuery__
 *
 * To run a query within a React component, call `useTrickResultDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useTrickResultDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTrickResultDataQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useTrickResultDataQuery(baseOptions: Apollo.QueryHookOptions<TrickResultDataQuery, TrickResultDataQueryVariables> & ({ variables: TrickResultDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<TrickResultDataQuery, TrickResultDataQueryVariables>(TrickResultDataDocument, options);
      }
export function useTrickResultDataLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TrickResultDataQuery, TrickResultDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<TrickResultDataQuery, TrickResultDataQueryVariables>(TrickResultDataDocument, options);
        }
// @ts-ignore
export function useTrickResultDataSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<TrickResultDataQuery, TrickResultDataQueryVariables>): Apollo.UseSuspenseQueryResult<TrickResultDataQuery, TrickResultDataQueryVariables>;
export function useTrickResultDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrickResultDataQuery, TrickResultDataQueryVariables>): Apollo.UseSuspenseQueryResult<TrickResultDataQuery | undefined, TrickResultDataQueryVariables>;
export function useTrickResultDataSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<TrickResultDataQuery, TrickResultDataQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<TrickResultDataQuery, TrickResultDataQueryVariables>(TrickResultDataDocument, options);
        }
export type TrickResultDataQueryHookResult = ReturnType<typeof useTrickResultDataQuery>;
export type TrickResultDataLazyQueryHookResult = ReturnType<typeof useTrickResultDataLazyQuery>;
export type TrickResultDataSuspenseQueryHookResult = ReturnType<typeof useTrickResultDataSuspenseQuery>;
export type TrickResultDataQueryResult = Apollo.QueryResult<TrickResultDataQuery, TrickResultDataQueryVariables>;
export const AddPlayerDocument = gql`
    mutation AddPlayer($gameId: String!, $name: String!) {
  addPlayer(gameId: $gameId, name: $name)
}
    `;
export type AddPlayerMutationFn = Apollo.MutationFunction<AddPlayerMutation, AddPlayerMutationVariables>;

/**
 * __useAddPlayerMutation__
 *
 * To run a mutation, you first call `useAddPlayerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddPlayerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addPlayerMutation, { data, loading, error }] = useAddPlayerMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useAddPlayerMutation(baseOptions?: Apollo.MutationHookOptions<AddPlayerMutation, AddPlayerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddPlayerMutation, AddPlayerMutationVariables>(AddPlayerDocument, options);
      }
export type AddPlayerMutationHookResult = ReturnType<typeof useAddPlayerMutation>;
export type AddPlayerMutationResult = Apollo.MutationResult<AddPlayerMutation>;
export type AddPlayerMutationOptions = Apollo.BaseMutationOptions<AddPlayerMutation, AddPlayerMutationVariables>;
export const LobbyQueryDocument = gql`
    query LobbyQuery($gameId: String!, $playerToken: String) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    scoringMode
    pirateAbilities
    deckConfig {
      includeMermaids
      includeKraken
      includeWhiteWhale
      includeLoot
    }
    players {
      id
      name
    }
  }
}
    `;

/**
 * __useLobbyQueryQuery__
 *
 * To run a query within a React component, call `useLobbyQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useLobbyQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useLobbyQueryQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useLobbyQueryQuery(baseOptions: Apollo.QueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables> & ({ variables: LobbyQueryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LobbyQueryQuery, LobbyQueryQueryVariables>(LobbyQueryDocument, options);
      }
export function useLobbyQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LobbyQueryQuery, LobbyQueryQueryVariables>(LobbyQueryDocument, options);
        }
// @ts-ignore
export function useLobbyQuerySuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables>): Apollo.UseSuspenseQueryResult<LobbyQueryQuery, LobbyQueryQueryVariables>;
export function useLobbyQuerySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables>): Apollo.UseSuspenseQueryResult<LobbyQueryQuery | undefined, LobbyQueryQueryVariables>;
export function useLobbyQuerySuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<LobbyQueryQuery, LobbyQueryQueryVariables>(LobbyQueryDocument, options);
        }
export type LobbyQueryQueryHookResult = ReturnType<typeof useLobbyQueryQuery>;
export type LobbyQueryLazyQueryHookResult = ReturnType<typeof useLobbyQueryLazyQuery>;
export type LobbyQuerySuspenseQueryHookResult = ReturnType<typeof useLobbyQuerySuspenseQuery>;
export type LobbyQueryQueryResult = Apollo.QueryResult<LobbyQueryQuery, LobbyQueryQueryVariables>;
export const PlayersDocument = gql`
    query Players($gameId: String!) {
  state(gameId: $gameId) {
    id
    players {
      id
      name
    }
  }
}
    `;

/**
 * __usePlayersQuery__
 *
 * To run a query within a React component, call `usePlayersQuery` and pass it any options that fit your needs.
 * When your component renders, `usePlayersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePlayersQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *   },
 * });
 */
export function usePlayersQuery(baseOptions: Apollo.QueryHookOptions<PlayersQuery, PlayersQueryVariables> & ({ variables: PlayersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PlayersQuery, PlayersQueryVariables>(PlayersDocument, options);
      }
export function usePlayersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PlayersQuery, PlayersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PlayersQuery, PlayersQueryVariables>(PlayersDocument, options);
        }
// @ts-ignore
export function usePlayersSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PlayersQuery, PlayersQueryVariables>): Apollo.UseSuspenseQueryResult<PlayersQuery, PlayersQueryVariables>;
export function usePlayersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PlayersQuery, PlayersQueryVariables>): Apollo.UseSuspenseQueryResult<PlayersQuery | undefined, PlayersQueryVariables>;
export function usePlayersSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PlayersQuery, PlayersQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PlayersQuery, PlayersQueryVariables>(PlayersDocument, options);
        }
export type PlayersQueryHookResult = ReturnType<typeof usePlayersQuery>;
export type PlayersLazyQueryHookResult = ReturnType<typeof usePlayersLazyQuery>;
export type PlayersSuspenseQueryHookResult = ReturnType<typeof usePlayersSuspenseQuery>;
export type PlayersQueryResult = Apollo.QueryResult<PlayersQuery, PlayersQueryVariables>;
export const StartGameDocument = gql`
    mutation StartGame($gameId: String!, $playerToken: String!) {
  startGame(gameId: $gameId, playerToken: $playerToken)
}
    `;
export type StartGameMutationFn = Apollo.MutationFunction<StartGameMutation, StartGameMutationVariables>;

/**
 * __useStartGameMutation__
 *
 * To run a mutation, you first call `useStartGameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartGameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startGameMutation, { data, loading, error }] = useStartGameMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useStartGameMutation(baseOptions?: Apollo.MutationHookOptions<StartGameMutation, StartGameMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<StartGameMutation, StartGameMutationVariables>(StartGameDocument, options);
      }
export type StartGameMutationHookResult = ReturnType<typeof useStartGameMutation>;
export type StartGameMutationResult = Apollo.MutationResult<StartGameMutation>;
export type StartGameMutationOptions = Apollo.BaseMutationOptions<StartGameMutation, StartGameMutationVariables>;
export const GamesDocument = gql`
    query Games {
  games
}
    `;

/**
 * __useGamesQuery__
 *
 * To run a query within a React component, call `useGamesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGamesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGamesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGamesQuery(baseOptions?: Apollo.QueryHookOptions<GamesQuery, GamesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options);
      }
export function useGamesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GamesQuery, GamesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options);
        }
// @ts-ignore
export function useGamesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GamesQuery, GamesQueryVariables>): Apollo.UseSuspenseQueryResult<GamesQuery, GamesQueryVariables>;
export function useGamesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamesQuery, GamesQueryVariables>): Apollo.UseSuspenseQueryResult<GamesQuery | undefined, GamesQueryVariables>;
export function useGamesSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GamesQuery, GamesQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GamesQuery, GamesQueryVariables>(GamesDocument, options);
        }
export type GamesQueryHookResult = ReturnType<typeof useGamesQuery>;
export type GamesLazyQueryHookResult = ReturnType<typeof useGamesLazyQuery>;
export type GamesSuspenseQueryHookResult = ReturnType<typeof useGamesSuspenseQuery>;
export type GamesQueryResult = Apollo.QueryResult<GamesQuery, GamesQueryVariables>;
export const NewGameDocument = gql`
    mutation NewGame($deckConfig: DeckConfigInput, $pirateAbilities: Boolean, $scoringMode: ScoringMode) {
  newGame(
    deckConfig: $deckConfig
    pirateAbilities: $pirateAbilities
    scoringMode: $scoringMode
  )
}
    `;
export type NewGameMutationFn = Apollo.MutationFunction<NewGameMutation, NewGameMutationVariables>;

/**
 * __useNewGameMutation__
 *
 * To run a mutation, you first call `useNewGameMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useNewGameMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [newGameMutation, { data, loading, error }] = useNewGameMutation({
 *   variables: {
 *      deckConfig: // value for 'deckConfig'
 *      pirateAbilities: // value for 'pirateAbilities'
 *      scoringMode: // value for 'scoringMode'
 *   },
 * });
 */
export function useNewGameMutation(baseOptions?: Apollo.MutationHookOptions<NewGameMutation, NewGameMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<NewGameMutation, NewGameMutationVariables>(NewGameDocument, options);
      }
export type NewGameMutationHookResult = ReturnType<typeof useNewGameMutation>;
export type NewGameMutationResult = Apollo.MutationResult<NewGameMutation>;
export type NewGameMutationOptions = Apollo.BaseMutationOptions<NewGameMutation, NewGameMutationVariables>;