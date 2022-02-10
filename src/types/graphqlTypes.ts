import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions =  {}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Card = SpecialCard | ColoredCard;

export enum Color {
  Yellow = 'YELLOW',
  Green = 'GREEN',
  Purple = 'PURPLE',
  Black = 'BLACK'
}

export type ColoredCard = {
  __typename?: 'ColoredCard';
  id: Scalars['String'];
  color: Scalars['String'];
  number: Scalars['Int'];
};

export type CurrentRound = {
  __typename?: 'CurrentRound';
  id: Scalars['Int'];
  roundNumber: Scalars['Int'];
  phase: Scalars['String'];
  leader: Scalars['String'];
  playerTurn: Scalars['String'];
  myBid?: Maybe<Scalars['Int']>;
  trickColor?: Maybe<Color>;
  cardsPlayed: Array<PlayedCard>;
};

export type GameState = {
  __typename?: 'GameState';
  id: Scalars['String'];
  phase: Scalars['String'];
  me?: Maybe<Player>;
  players: Array<Player>;
  currentRound: CurrentRound;
  scorecard?: Maybe<Array<Array<ScoreBlock>>>;
};

export type Mutation = {
  __typename?: 'Mutation';
  newGame: Scalars['String'];
  startGame: Scalars['Boolean'];
  addPlayer: Scalars['String'];
  submitBid: Scalars['Boolean'];
  playColoredCard: Scalars['Boolean'];
  playSpecialCard: Scalars['Boolean'];
};


export type MutationStartGameArgs = {
  gameId: Scalars['String'];
};


export type MutationAddPlayerArgs = {
  gameId: Scalars['String'];
  name: Scalars['String'];
};


export type MutationSubmitBidArgs = {
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
  count: Scalars['Int'];
};


export type MutationPlayColoredCardArgs = {
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
  cardId: Scalars['String'];
};


export type MutationPlaySpecialCardArgs = {
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
  cardId: Scalars['String'];
  selection?: Maybe<Scalars['String']>;
};

export type PlayedCard = {
  __typename?: 'PlayedCard';
  playerId: Scalars['String'];
  card: Card;
};

export type Player = {
  __typename?: 'Player';
  id: Scalars['String'];
  name: Scalars['String'];
  hand: Array<Card>;
};

export type Query = {
  __typename?: 'Query';
  players: Scalars['String'];
  games: Array<Scalars['String']>;
  state?: Maybe<GameState>;
};


export type QueryPlayersArgs = {
  gameId: Scalars['String'];
};


export type QueryStateArgs = {
  gameId: Scalars['String'];
  playerToken?: Maybe<Scalars['String']>;
};

export type ScoreBlock = {
  __typename?: 'ScoreBlock';
  playerName: Scalars['String'];
  tricksBid: Scalars['Int'];
  tricksWon: Scalars['Int'];
  bidPoints: Scalars['Int'];
  bonusPoints: Scalars['Int'];
  totalPoints: Scalars['Int'];
};

export type SpecialCard = {
  __typename?: 'SpecialCard';
  id: Scalars['String'];
  type: Scalars['String'];
  selection?: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  hello?: Maybe<Scalars['String']>;
  state?: Maybe<GameState>;
};


export type SubscriptionStateArgs = {
  gameId: Scalars['String'];
  playerToken?: Maybe<Scalars['String']>;
};

export type GamePhaseQueryQueryVariables = Exact<{
  gameId: Scalars['String'];
}>;


export type GamePhaseQueryQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, phase: string }> };

export type GameStateQueryVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
}>;


export type GameStateQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, players: Array<{ __typename?: 'Player', id: string, name: string }>, me?: Maybe<{ __typename?: 'Player', id: string, name: string }>, currentRound: { __typename?: 'CurrentRound', id: number, phase: string, leader: string, playerTurn: string, myBid?: Maybe<number> } }> };

export type SubmitBidMutationVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
  count: Scalars['Int'];
}>;


export type SubmitBidMutation = { __typename?: 'Mutation', submitBid: boolean };

export type MyHandQueryVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
}>;


export type MyHandQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, me?: Maybe<{ __typename?: 'Player', id: string, name: string, hand: Array<{ __typename: 'SpecialCard', id: string, type: string } | { __typename: 'ColoredCard', id: string, color: string, number: number }> }>, currentRound: { __typename?: 'CurrentRound', id: number, phase: string, playerTurn: string, trickColor?: Maybe<Color>, myBid?: Maybe<number> } }> };

export type PlaySpecialCardMutationVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
  cardId: Scalars['String'];
  selection?: Maybe<Scalars['String']>;
}>;


export type PlaySpecialCardMutation = { __typename?: 'Mutation', playSpecialCard: boolean };

export type PlayColoredCardMutationVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
  cardId: Scalars['String'];
}>;


export type PlayColoredCardMutation = { __typename?: 'Mutation', playColoredCard: boolean };

export type CardsPlayedQueryVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
}>;


export type CardsPlayedQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, currentRound: { __typename?: 'CurrentRound', id: number, phase: string, cardsPlayed: Array<{ __typename?: 'PlayedCard', playerId: string, card: { __typename: 'SpecialCard', id: string, type: string, selection?: Maybe<string> } | { __typename: 'ColoredCard', id: string, color: string, number: number } }> } }> };

export type ScorecardQueryVariables = Exact<{
  gameId: Scalars['String'];
  playerToken: Scalars['String'];
}>;


export type ScorecardQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, me?: Maybe<{ __typename?: 'Player', id: string, name: string }>, scorecard?: Maybe<Array<Array<{ __typename?: 'ScoreBlock', playerName: string, tricksBid: number, tricksWon: number, bidPoints: number, bonusPoints: number, totalPoints: number }>>> }> };

export type AddPlayerMutationVariables = Exact<{
  gameId: Scalars['String'];
  name: Scalars['String'];
}>;


export type AddPlayerMutation = { __typename?: 'Mutation', addPlayer: string };

export type LobbyQueryQueryVariables = Exact<{
  gameId: Scalars['String'];
  playerToken?: Maybe<Scalars['String']>;
}>;


export type LobbyQueryQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, players: Array<{ __typename?: 'Player', id: string, name: string }> }> };

export type PlayersQueryVariables = Exact<{
  gameId: Scalars['String'];
}>;


export type PlayersQuery = { __typename?: 'Query', state?: Maybe<{ __typename?: 'GameState', id: string, players: Array<{ __typename?: 'Player', id: string, name: string }> }> };

export type StartGameMutationVariables = Exact<{
  gameId: Scalars['String'];
}>;


export type StartGameMutation = { __typename?: 'Mutation', startGame: boolean };

export type GamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GamesQuery = { __typename?: 'Query', games: Array<string> };

export type NewGameMutationVariables = Exact<{ [key: string]: never; }>;


export type NewGameMutation = { __typename?: 'Mutation', newGame: string };


export const GamePhaseQueryDocument = gql`
    query GamePhaseQuery($gameId: String!) {
  state(gameId: $gameId) {
    id
    phase
  }
}
    `;

/**
 * __useGamePhaseQueryQuery__
 *
 * To run a query within a React component, call `useGamePhaseQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGamePhaseQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGamePhaseQueryQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *   },
 * });
 */
export function useGamePhaseQueryQuery(baseOptions: Apollo.QueryHookOptions<GamePhaseQueryQuery, GamePhaseQueryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GamePhaseQueryQuery, GamePhaseQueryQueryVariables>(GamePhaseQueryDocument, options);
      }
export function useGamePhaseQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GamePhaseQueryQuery, GamePhaseQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GamePhaseQueryQuery, GamePhaseQueryQueryVariables>(GamePhaseQueryDocument, options);
        }
export type GamePhaseQueryQueryHookResult = ReturnType<typeof useGamePhaseQueryQuery>;
export type GamePhaseQueryLazyQueryHookResult = ReturnType<typeof useGamePhaseQueryLazyQuery>;
export type GamePhaseQueryQueryResult = Apollo.QueryResult<GamePhaseQueryQuery, GamePhaseQueryQueryVariables>;
export const GameStateDocument = gql`
    query GameState($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    players {
      id
      name
    }
    me {
      id
      name
    }
    currentRound {
      id
      phase
      leader
      playerTurn
      myBid
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
export function useGameStateQuery(baseOptions: Apollo.QueryHookOptions<GameStateQuery, GameStateQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GameStateQuery, GameStateQueryVariables>(GameStateDocument, options);
      }
export function useGameStateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GameStateQuery, GameStateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GameStateQuery, GameStateQueryVariables>(GameStateDocument, options);
        }
export type GameStateQueryHookResult = ReturnType<typeof useGameStateQuery>;
export type GameStateLazyQueryHookResult = ReturnType<typeof useGameStateLazyQuery>;
export type GameStateQueryResult = Apollo.QueryResult<GameStateQuery, GameStateQueryVariables>;
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
export const MyHandDocument = gql`
    query MyHand($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    me {
      id
      name
      hand {
        __typename
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
export function useMyHandQuery(baseOptions: Apollo.QueryHookOptions<MyHandQuery, MyHandQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<MyHandQuery, MyHandQueryVariables>(MyHandDocument, options);
      }
export function useMyHandLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<MyHandQuery, MyHandQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<MyHandQuery, MyHandQueryVariables>(MyHandDocument, options);
        }
export type MyHandQueryHookResult = ReturnType<typeof useMyHandQuery>;
export type MyHandLazyQueryHookResult = ReturnType<typeof useMyHandLazyQuery>;
export type MyHandQueryResult = Apollo.QueryResult<MyHandQuery, MyHandQueryVariables>;
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
export const CardsPlayedDocument = gql`
    query CardsPlayed($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    currentRound {
      id
      phase
      cardsPlayed {
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
export function useCardsPlayedQuery(baseOptions: Apollo.QueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CardsPlayedQuery, CardsPlayedQueryVariables>(CardsPlayedDocument, options);
      }
export function useCardsPlayedLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CardsPlayedQuery, CardsPlayedQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CardsPlayedQuery, CardsPlayedQueryVariables>(CardsPlayedDocument, options);
        }
export type CardsPlayedQueryHookResult = ReturnType<typeof useCardsPlayedQuery>;
export type CardsPlayedLazyQueryHookResult = ReturnType<typeof useCardsPlayedLazyQuery>;
export type CardsPlayedQueryResult = Apollo.QueryResult<CardsPlayedQuery, CardsPlayedQueryVariables>;
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
export function useScorecardQuery(baseOptions: Apollo.QueryHookOptions<ScorecardQuery, ScorecardQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<ScorecardQuery, ScorecardQueryVariables>(ScorecardDocument, options);
      }
export function useScorecardLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<ScorecardQuery, ScorecardQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<ScorecardQuery, ScorecardQueryVariables>(ScorecardDocument, options);
        }
export type ScorecardQueryHookResult = ReturnType<typeof useScorecardQuery>;
export type ScorecardLazyQueryHookResult = ReturnType<typeof useScorecardLazyQuery>;
export type ScorecardQueryResult = Apollo.QueryResult<ScorecardQuery, ScorecardQueryVariables>;
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
export function useLobbyQueryQuery(baseOptions: Apollo.QueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<LobbyQueryQuery, LobbyQueryQueryVariables>(LobbyQueryDocument, options);
      }
export function useLobbyQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<LobbyQueryQuery, LobbyQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<LobbyQueryQuery, LobbyQueryQueryVariables>(LobbyQueryDocument, options);
        }
export type LobbyQueryQueryHookResult = ReturnType<typeof useLobbyQueryQuery>;
export type LobbyQueryLazyQueryHookResult = ReturnType<typeof useLobbyQueryLazyQuery>;
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
export function usePlayersQuery(baseOptions: Apollo.QueryHookOptions<PlayersQuery, PlayersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PlayersQuery, PlayersQueryVariables>(PlayersDocument, options);
      }
export function usePlayersLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PlayersQuery, PlayersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PlayersQuery, PlayersQueryVariables>(PlayersDocument, options);
        }
export type PlayersQueryHookResult = ReturnType<typeof usePlayersQuery>;
export type PlayersLazyQueryHookResult = ReturnType<typeof usePlayersLazyQuery>;
export type PlayersQueryResult = Apollo.QueryResult<PlayersQuery, PlayersQueryVariables>;
export const StartGameDocument = gql`
    mutation StartGame($gameId: String!) {
  startGame(gameId: $gameId)
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
export type GamesQueryHookResult = ReturnType<typeof useGamesQuery>;
export type GamesLazyQueryHookResult = ReturnType<typeof useGamesLazyQuery>;
export type GamesQueryResult = Apollo.QueryResult<GamesQuery, GamesQueryVariables>;
export const NewGameDocument = gql`
    mutation NewGame {
  newGame
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