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
  choice?: Maybe<Scalars['Boolean']['output']>;
  color: Scalars['String']['output'];
  expansion?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['String']['output'];
  number: Scalars['Int']['output'];
  wild?: Maybe<Scalars['Boolean']['output']>;
};

export type DeckConfig = {
  __typename?: 'DeckConfig';
  includeDavyJones: Scalars['Boolean']['output'];
  includeExpansion: Scalars['Boolean']['output'];
  includeFirstMate: Scalars['Boolean']['output'];
  includeKraken: Scalars['Boolean']['output'];
  includeLastVolley: Scalars['Boolean']['output'];
  includeLoot: Scalars['Boolean']['output'];
  includeMermaids: Scalars['Boolean']['output'];
  includeStingray: Scalars['Boolean']['output'];
  includeWalkThePlank: Scalars['Boolean']['output'];
  includeWhiteWhale: Scalars['Boolean']['output'];
};

export type DeckConfigInput = {
  includeDavyJones?: InputMaybe<Scalars['Boolean']['input']>;
  includeExpansion?: InputMaybe<Scalars['Boolean']['input']>;
  includeFirstMate?: InputMaybe<Scalars['Boolean']['input']>;
  includeKraken?: InputMaybe<Scalars['Boolean']['input']>;
  includeLastVolley?: InputMaybe<Scalars['Boolean']['input']>;
  includeLoot?: InputMaybe<Scalars['Boolean']['input']>;
  includeMermaids?: InputMaybe<Scalars['Boolean']['input']>;
  includeStingray?: InputMaybe<Scalars['Boolean']['input']>;
  includeWalkThePlank?: InputMaybe<Scalars['Boolean']['input']>;
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
  nextGameId?: Maybe<Scalars['String']['output']>;
  phase: Scalars['String']['output'];
  pirateAbilities: Scalars['Boolean']['output'];
  players: Array<Player>;
  practice: Scalars['Boolean']['output'];
  roundSchedule: Array<Scalars['Int']['output']>;
  scorecard?: Maybe<Array<Array<ScoreBlock>>>;
  scoringMode: ScoringMode;
  tieBreakers: Scalars['Boolean']['output'];
};

export type Hand = {
  __typename?: 'Hand';
  cardsPlayed: Array<PlayedCard>;
  id: Scalars['String']['output'];
  removedCardIds?: Maybe<Array<Scalars['String']['output']>>;
  trickColor?: Maybe<Color>;
  trickDiscarded?: Maybe<Scalars['Boolean']['output']>;
  winningCard?: Maybe<PlayedCard>;
};

export type Mutation = {
  __typename?: 'Mutation';
  addBot: Scalars['String']['output'];
  addPlayer: Scalars['String']['output'];
  advanceTrick: Scalars['Boolean']['output'];
  choosePlankTarget: Scalars['Boolean']['output'];
  enableAwayAutoplay: Scalars['Boolean']['output'];
  leaveGame: Scalars['Boolean']['output'];
  loadCannon: Scalars['Boolean']['output'];
  newGame: Scalars['String']['output'];
  playColoredCard: Scalars['Boolean']['output'];
  playSpecialCard: Scalars['Boolean']['output'];
  rematchGame: Scalars['String']['output'];
  removeBot: Scalars['Boolean']['output'];
  setAutoplay: Scalars['Boolean']['output'];
  startGame: Scalars['Boolean']['output'];
  submitBid: Scalars['Boolean']['output'];
  usePirateAbility: Scalars['Boolean']['output'];
};


export type MutationAddBotArgs = {
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
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


export type MutationChoosePlankTargetArgs = {
  cardId: Scalars['String']['input'];
  expectedChoiceId: Scalars['String']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationEnableAwayAutoplayArgs = {
  expectedLastSeenAt: Scalars['Float']['input'];
  gameId: Scalars['String']['input'];
  playerId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationLeaveGameArgs = {
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
  colorChoice?: InputMaybe<Color>;
  gameId: Scalars['String']['input'];
  numberChoice?: InputMaybe<Scalars['Int']['input']>;
  playerToken: Scalars['String']['input'];
};


export type MutationPlaySpecialCardArgs = {
  cardId: Scalars['String']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  selection?: InputMaybe<Scalars['String']['input']>;
};


export type MutationRematchGameArgs = {
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationRemoveBotArgs = {
  gameId: Scalars['String']['input'];
  playerId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
};


export type MutationSetAutoplayArgs = {
  enabled: Scalars['Boolean']['input'];
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
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
  canDecline: Scalars['Boolean']['output'];
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
  ForceCard = 'forceCard',
  Reveal = 'reveal',
  Wager = 'wager'
}

export type PirateAbilityInput = {
  action: PirateAbilityAction;
  amount?: InputMaybe<Scalars['Int']['input']>;
  cardIds?: InputMaybe<Array<Scalars['String']['input']>>;
  playerId?: InputMaybe<Scalars['String']['input']>;
};

export type PlankChoice = {
  __typename?: 'PlankChoice';
  cardIds: Array<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  playerId: Scalars['String']['output'];
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
  isAutoplay: Scalars['Boolean']['output'];
  isBot: Scalars['Boolean']['output'];
  lastSeenAt?: Maybe<Scalars['Float']['output']>;
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
  myForcedCardId?: Maybe<Scalars['String']['output']>;
  phase: Scalars['String']['output'];
  pirateAbility?: Maybe<PirateAbility>;
  plankChoice?: Maybe<PlankChoice>;
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


export type RoundNumberQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, currentRound?: { __typename?: 'Round', id: number, roundNumber: number, cardsPerPlayer: number } | null } | null };

export type SubmitBidMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  count: Scalars['Int']['input'];
}>;


export type SubmitBidMutation = { __typename?: 'Mutation', submitBid: boolean };

export type CannonChoiceQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type CannonChoiceQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, currentRound?: { __typename?: 'Round', id: number, roundNumber: number, cardsPerPlayer: number, myCannonLoad?: CannonLoad | null } | null } | null };

export type LoadCannonMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  load: CannonLoad;
  expectedRoundNumber: Scalars['Int']['input'];
}>;


export type LoadCannonMutation = { __typename?: 'Mutation', loadCannon: boolean };

export type GameStateQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type GameStateQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, legalCardIds: Array<string>, players: Array<{ __typename?: 'Player', id: string, name: string, handCount: number, isAutomated: boolean, bid?: number | null, tricksWon: number }>, me?: { __typename?: 'Player', id: string, name: string, handCount: number, isAutomated: boolean, bid?: number | null, tricksWon: number } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, leader: string, playerTurn?: string | null, myBid?: number | null, roundNumber: number, pirateAbility?: { __typename?: 'PirateAbility', id: string } | null, cardsPlayed: Array<{ __typename?: 'PlayedCard', id: string, playerId: string }> } | null } | null };

export type MyHandQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type MyHandQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, me?: { __typename?: 'Player', id: string, name: string, hand: Array<{ __typename?: 'ColoredCard', id: string, color: string, choice?: boolean | null, wild?: boolean | null, expansion?: boolean | null, number: number } | { __typename?: 'SpecialCard', id: string, type: string }> } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, playerTurn?: string | null, trickColor?: Color | null, myForcedCardId?: string | null, myBid?: number | null } | null } | null };

export type PlayColoredCardMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  cardId: Scalars['String']['input'];
  numberChoice?: InputMaybe<Scalars['Int']['input']>;
  colorChoice?: InputMaybe<Color>;
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


export type PirateAbilityStateQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, phase: string, players: Array<{ __typename?: 'Player', id: string, name: string }>, me?: { __typename?: 'Player', id: string, hand: Array<{ __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null }> } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, roundNumber: number, myBid?: number | null, leader: string, playerTurn?: string | null, pirateAbility?: { __typename?: 'PirateAbility', id: string, pirateId: string, name: string, kind: string, playerId: string, canDecline: boolean, stage: string, privateCards: Array<{ __typename: 'ColoredCard', id: string, color: string, number: number } | { __typename: 'SpecialCard', id: string, type: string, selection?: string | null }> } | null } | null } | null };

export type ResolvePirateAbilityMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  expectedAbilityId: Scalars['String']['input'];
  input: PirateAbilityInput;
}>;


export type ResolvePirateAbilityMutation = { __typename?: 'Mutation', usePirateAbility: boolean };

export type PlankChoiceStateQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type PlankChoiceStateQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, me?: { __typename?: 'Player', id: string } | null, currentRound?: { __typename?: 'Round', id: number, phase: string, plankChoice?: { __typename?: 'PlankChoice', id: string, playerId: string, cardIds: Array<string> } | null } | null } | null };

export type ChoosePlankTargetMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  expectedChoiceId: Scalars['String']['input'];
  cardId: Scalars['String']['input'];
}>;


export type ChoosePlankTargetMutation = { __typename?: 'Mutation', choosePlankTarget: boolean };

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


export type LobbyQueryQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, roundSchedule: Array<number>, tieBreakers: boolean, cannonball: boolean, maxPlayers: number, scoringMode: ScoringMode, pirateAbilities: boolean, me?: { __typename?: 'Player', id: string } | null, deckConfig: { __typename?: 'DeckConfig', includeMermaids: boolean, includeKraken: boolean, includeWhiteWhale: boolean, includeExpansion: boolean, includeFirstMate: boolean, includeStingray: boolean, includeDavyJones: boolean, includeWalkThePlank: boolean, includeLastVolley: boolean, includeLoot: boolean }, players: Array<{ __typename?: 'Player', id: string, isBot: boolean, name: string }> } | null };

export type FinalResultQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type FinalResultQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, nextGameId?: string | null, me?: { __typename?: 'Player', id: string } | null, scorecard?: Array<Array<{ __typename?: 'ScoreBlock', playerName: string, totalPoints: number }>> | null } | null };

export type RematchMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type RematchMutation = { __typename?: 'Mutation', rematchGame: string };

export type PracticeStateQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken?: InputMaybe<Scalars['String']['input']>;
}>;


export type PracticeStateQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', phase: string, practice: boolean, maxPlayers: number, me?: { __typename?: 'Player', id: string, isAutoplay: boolean } | null, players: Array<{ __typename?: 'Player', id: string, name: string, isBot: boolean, isAutomated: boolean, isAutoplay: boolean, lastSeenAt?: number | null }> } | null };

export type AddPracticeBotMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type AddPracticeBotMutation = { __typename?: 'Mutation', addBot: string };

export type RemovePracticeBotMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  playerId: Scalars['String']['input'];
}>;


export type RemovePracticeBotMutation = { __typename?: 'Mutation', removeBot: boolean };

export type SetSeatAutoplayMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  enabled: Scalars['Boolean']['input'];
}>;


export type SetSeatAutoplayMutation = { __typename?: 'Mutation', setAutoplay: boolean };

export type HelpAbsentPlayerMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
  playerId: Scalars['String']['input'];
  expectedLastSeenAt: Scalars['Float']['input'];
}>;


export type HelpAbsentPlayerMutation = { __typename?: 'Mutation', enableAwayAutoplay: boolean };

export type LeaveSeatMutationVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type LeaveSeatMutation = { __typename?: 'Mutation', leaveGame: boolean };

export type RecoverSeatQueryVariables = Exact<{
  gameId: Scalars['String']['input'];
  playerToken: Scalars['String']['input'];
}>;


export type RecoverSeatQuery = { __typename?: 'Query', state?: { __typename?: 'GameState', id: string, me?: { __typename?: 'Player', id: string, name: string } | null } | null };

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
  roundSchedule?: InputMaybe<Array<Scalars['Int']['input']> | Scalars['Int']['input']>;
  tieBreakers?: InputMaybe<Scalars['Boolean']['input']>;
  cannonball?: InputMaybe<Scalars['Boolean']['input']>;
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
      cardsPerPlayer
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
export const CannonChoiceDocument = gql`
    query CannonChoice($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    currentRound {
      id
      roundNumber
      cardsPerPlayer
      myCannonLoad
    }
  }
}
    `;

/**
 * __useCannonChoiceQuery__
 *
 * To run a query within a React component, call `useCannonChoiceQuery` and pass it any options that fit your needs.
 * When your component renders, `useCannonChoiceQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCannonChoiceQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useCannonChoiceQuery(baseOptions: Apollo.QueryHookOptions<CannonChoiceQuery, CannonChoiceQueryVariables> & ({ variables: CannonChoiceQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<CannonChoiceQuery, CannonChoiceQueryVariables>(CannonChoiceDocument, options);
      }
export function useCannonChoiceLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<CannonChoiceQuery, CannonChoiceQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<CannonChoiceQuery, CannonChoiceQueryVariables>(CannonChoiceDocument, options);
        }
// @ts-ignore
export function useCannonChoiceSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<CannonChoiceQuery, CannonChoiceQueryVariables>): Apollo.UseSuspenseQueryResult<CannonChoiceQuery, CannonChoiceQueryVariables>;
export function useCannonChoiceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CannonChoiceQuery, CannonChoiceQueryVariables>): Apollo.UseSuspenseQueryResult<CannonChoiceQuery | undefined, CannonChoiceQueryVariables>;
export function useCannonChoiceSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<CannonChoiceQuery, CannonChoiceQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<CannonChoiceQuery, CannonChoiceQueryVariables>(CannonChoiceDocument, options);
        }
export type CannonChoiceQueryHookResult = ReturnType<typeof useCannonChoiceQuery>;
export type CannonChoiceLazyQueryHookResult = ReturnType<typeof useCannonChoiceLazyQuery>;
export type CannonChoiceSuspenseQueryHookResult = ReturnType<typeof useCannonChoiceSuspenseQuery>;
export type CannonChoiceQueryResult = Apollo.QueryResult<CannonChoiceQuery, CannonChoiceQueryVariables>;
export const LoadCannonDocument = gql`
    mutation LoadCannon($gameId: String!, $playerToken: String!, $load: CannonLoad!, $expectedRoundNumber: Int!) {
  loadCannon(
    gameId: $gameId
    playerToken: $playerToken
    load: $load
    expectedRoundNumber: $expectedRoundNumber
  )
}
    `;
export type LoadCannonMutationFn = Apollo.MutationFunction<LoadCannonMutation, LoadCannonMutationVariables>;

/**
 * __useLoadCannonMutation__
 *
 * To run a mutation, you first call `useLoadCannonMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLoadCannonMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [loadCannonMutation, { data, loading, error }] = useLoadCannonMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      load: // value for 'load'
 *      expectedRoundNumber: // value for 'expectedRoundNumber'
 *   },
 * });
 */
export function useLoadCannonMutation(baseOptions?: Apollo.MutationHookOptions<LoadCannonMutation, LoadCannonMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LoadCannonMutation, LoadCannonMutationVariables>(LoadCannonDocument, options);
      }
export type LoadCannonMutationHookResult = ReturnType<typeof useLoadCannonMutation>;
export type LoadCannonMutationResult = Apollo.MutationResult<LoadCannonMutation>;
export type LoadCannonMutationOptions = Apollo.BaseMutationOptions<LoadCannonMutation, LoadCannonMutationVariables>;
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
          choice
          wild
          expansion
          number
        }
      }
    }
    currentRound {
      id
      phase
      playerTurn
      trickColor
      myForcedCardId
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
    mutation PlayColoredCard($gameId: String!, $playerToken: String!, $cardId: String!, $numberChoice: Int, $colorChoice: Color) {
  playColoredCard(
    gameId: $gameId
    playerToken: $playerToken
    cardId: $cardId
    numberChoice: $numberChoice
    colorChoice: $colorChoice
  )
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
 *      numberChoice: // value for 'numberChoice'
 *      colorChoice: // value for 'colorChoice'
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
        canDecline
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
export const PlankChoiceStateDocument = gql`
    query PlankChoiceState($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    me {
      id
    }
    currentRound {
      id
      phase
      plankChoice {
        id
        playerId
        cardIds
      }
    }
  }
}
    `;

/**
 * __usePlankChoiceStateQuery__
 *
 * To run a query within a React component, call `usePlankChoiceStateQuery` and pass it any options that fit your needs.
 * When your component renders, `usePlankChoiceStateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePlankChoiceStateQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function usePlankChoiceStateQuery(baseOptions: Apollo.QueryHookOptions<PlankChoiceStateQuery, PlankChoiceStateQueryVariables> & ({ variables: PlankChoiceStateQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>(PlankChoiceStateDocument, options);
      }
export function usePlankChoiceStateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>(PlankChoiceStateDocument, options);
        }
// @ts-ignore
export function usePlankChoiceStateSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>): Apollo.UseSuspenseQueryResult<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>;
export function usePlankChoiceStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>): Apollo.UseSuspenseQueryResult<PlankChoiceStateQuery | undefined, PlankChoiceStateQueryVariables>;
export function usePlankChoiceStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>(PlankChoiceStateDocument, options);
        }
export type PlankChoiceStateQueryHookResult = ReturnType<typeof usePlankChoiceStateQuery>;
export type PlankChoiceStateLazyQueryHookResult = ReturnType<typeof usePlankChoiceStateLazyQuery>;
export type PlankChoiceStateSuspenseQueryHookResult = ReturnType<typeof usePlankChoiceStateSuspenseQuery>;
export type PlankChoiceStateQueryResult = Apollo.QueryResult<PlankChoiceStateQuery, PlankChoiceStateQueryVariables>;
export const ChoosePlankTargetDocument = gql`
    mutation ChoosePlankTarget($gameId: String!, $playerToken: String!, $expectedChoiceId: String!, $cardId: String!) {
  choosePlankTarget(
    gameId: $gameId
    playerToken: $playerToken
    expectedChoiceId: $expectedChoiceId
    cardId: $cardId
  )
}
    `;
export type ChoosePlankTargetMutationFn = Apollo.MutationFunction<ChoosePlankTargetMutation, ChoosePlankTargetMutationVariables>;

/**
 * __useChoosePlankTargetMutation__
 *
 * To run a mutation, you first call `useChoosePlankTargetMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChoosePlankTargetMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [choosePlankTargetMutation, { data, loading, error }] = useChoosePlankTargetMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      expectedChoiceId: // value for 'expectedChoiceId'
 *      cardId: // value for 'cardId'
 *   },
 * });
 */
export function useChoosePlankTargetMutation(baseOptions?: Apollo.MutationHookOptions<ChoosePlankTargetMutation, ChoosePlankTargetMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ChoosePlankTargetMutation, ChoosePlankTargetMutationVariables>(ChoosePlankTargetDocument, options);
      }
export type ChoosePlankTargetMutationHookResult = ReturnType<typeof useChoosePlankTargetMutation>;
export type ChoosePlankTargetMutationResult = Apollo.MutationResult<ChoosePlankTargetMutation>;
export type ChoosePlankTargetMutationOptions = Apollo.BaseMutationOptions<ChoosePlankTargetMutation, ChoosePlankTargetMutationVariables>;
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
    me {
      id
    }
    roundSchedule
    tieBreakers
    cannonball
    maxPlayers
    scoringMode
    pirateAbilities
    deckConfig {
      includeMermaids
      includeKraken
      includeWhiteWhale
      includeExpansion
      includeFirstMate
      includeStingray
      includeDavyJones
      includeWalkThePlank
      includeLastVolley
      includeLoot
    }
    players {
      id
      isBot
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
export const FinalResultDocument = gql`
    query FinalResult($gameId: String!, $playerToken: String) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    nextGameId
    me {
      id
    }
    scorecard {
      playerName
      totalPoints
    }
  }
}
    `;

/**
 * __useFinalResultQuery__
 *
 * To run a query within a React component, call `useFinalResultQuery` and pass it any options that fit your needs.
 * When your component renders, `useFinalResultQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFinalResultQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useFinalResultQuery(baseOptions: Apollo.QueryHookOptions<FinalResultQuery, FinalResultQueryVariables> & ({ variables: FinalResultQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<FinalResultQuery, FinalResultQueryVariables>(FinalResultDocument, options);
      }
export function useFinalResultLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<FinalResultQuery, FinalResultQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<FinalResultQuery, FinalResultQueryVariables>(FinalResultDocument, options);
        }
// @ts-ignore
export function useFinalResultSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<FinalResultQuery, FinalResultQueryVariables>): Apollo.UseSuspenseQueryResult<FinalResultQuery, FinalResultQueryVariables>;
export function useFinalResultSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FinalResultQuery, FinalResultQueryVariables>): Apollo.UseSuspenseQueryResult<FinalResultQuery | undefined, FinalResultQueryVariables>;
export function useFinalResultSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FinalResultQuery, FinalResultQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<FinalResultQuery, FinalResultQueryVariables>(FinalResultDocument, options);
        }
export type FinalResultQueryHookResult = ReturnType<typeof useFinalResultQuery>;
export type FinalResultLazyQueryHookResult = ReturnType<typeof useFinalResultLazyQuery>;
export type FinalResultSuspenseQueryHookResult = ReturnType<typeof useFinalResultSuspenseQuery>;
export type FinalResultQueryResult = Apollo.QueryResult<FinalResultQuery, FinalResultQueryVariables>;
export const RematchDocument = gql`
    mutation Rematch($gameId: String!, $playerToken: String!) {
  rematchGame(gameId: $gameId, playerToken: $playerToken)
}
    `;
export type RematchMutationFn = Apollo.MutationFunction<RematchMutation, RematchMutationVariables>;

/**
 * __useRematchMutation__
 *
 * To run a mutation, you first call `useRematchMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRematchMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rematchMutation, { data, loading, error }] = useRematchMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useRematchMutation(baseOptions?: Apollo.MutationHookOptions<RematchMutation, RematchMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RematchMutation, RematchMutationVariables>(RematchDocument, options);
      }
export type RematchMutationHookResult = ReturnType<typeof useRematchMutation>;
export type RematchMutationResult = Apollo.MutationResult<RematchMutation>;
export type RematchMutationOptions = Apollo.BaseMutationOptions<RematchMutation, RematchMutationVariables>;
export const PracticeStateDocument = gql`
    query PracticeState($gameId: String!, $playerToken: String) {
  state(gameId: $gameId, playerToken: $playerToken) {
    phase
    practice
    maxPlayers
    me {
      id
      isAutoplay
    }
    players {
      id
      name
      isBot
      isAutomated
      isAutoplay
      lastSeenAt
    }
  }
}
    `;

/**
 * __usePracticeStateQuery__
 *
 * To run a query within a React component, call `usePracticeStateQuery` and pass it any options that fit your needs.
 * When your component renders, `usePracticeStateQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePracticeStateQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function usePracticeStateQuery(baseOptions: Apollo.QueryHookOptions<PracticeStateQuery, PracticeStateQueryVariables> & ({ variables: PracticeStateQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<PracticeStateQuery, PracticeStateQueryVariables>(PracticeStateDocument, options);
      }
export function usePracticeStateLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<PracticeStateQuery, PracticeStateQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<PracticeStateQuery, PracticeStateQueryVariables>(PracticeStateDocument, options);
        }
// @ts-ignore
export function usePracticeStateSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<PracticeStateQuery, PracticeStateQueryVariables>): Apollo.UseSuspenseQueryResult<PracticeStateQuery, PracticeStateQueryVariables>;
export function usePracticeStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PracticeStateQuery, PracticeStateQueryVariables>): Apollo.UseSuspenseQueryResult<PracticeStateQuery | undefined, PracticeStateQueryVariables>;
export function usePracticeStateSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<PracticeStateQuery, PracticeStateQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<PracticeStateQuery, PracticeStateQueryVariables>(PracticeStateDocument, options);
        }
export type PracticeStateQueryHookResult = ReturnType<typeof usePracticeStateQuery>;
export type PracticeStateLazyQueryHookResult = ReturnType<typeof usePracticeStateLazyQuery>;
export type PracticeStateSuspenseQueryHookResult = ReturnType<typeof usePracticeStateSuspenseQuery>;
export type PracticeStateQueryResult = Apollo.QueryResult<PracticeStateQuery, PracticeStateQueryVariables>;
export const AddPracticeBotDocument = gql`
    mutation AddPracticeBot($gameId: String!, $playerToken: String!) {
  addBot(gameId: $gameId, playerToken: $playerToken)
}
    `;
export type AddPracticeBotMutationFn = Apollo.MutationFunction<AddPracticeBotMutation, AddPracticeBotMutationVariables>;

/**
 * __useAddPracticeBotMutation__
 *
 * To run a mutation, you first call `useAddPracticeBotMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddPracticeBotMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addPracticeBotMutation, { data, loading, error }] = useAddPracticeBotMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useAddPracticeBotMutation(baseOptions?: Apollo.MutationHookOptions<AddPracticeBotMutation, AddPracticeBotMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<AddPracticeBotMutation, AddPracticeBotMutationVariables>(AddPracticeBotDocument, options);
      }
export type AddPracticeBotMutationHookResult = ReturnType<typeof useAddPracticeBotMutation>;
export type AddPracticeBotMutationResult = Apollo.MutationResult<AddPracticeBotMutation>;
export type AddPracticeBotMutationOptions = Apollo.BaseMutationOptions<AddPracticeBotMutation, AddPracticeBotMutationVariables>;
export const RemovePracticeBotDocument = gql`
    mutation RemovePracticeBot($gameId: String!, $playerToken: String!, $playerId: String!) {
  removeBot(gameId: $gameId, playerToken: $playerToken, playerId: $playerId)
}
    `;
export type RemovePracticeBotMutationFn = Apollo.MutationFunction<RemovePracticeBotMutation, RemovePracticeBotMutationVariables>;

/**
 * __useRemovePracticeBotMutation__
 *
 * To run a mutation, you first call `useRemovePracticeBotMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemovePracticeBotMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removePracticeBotMutation, { data, loading, error }] = useRemovePracticeBotMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      playerId: // value for 'playerId'
 *   },
 * });
 */
export function useRemovePracticeBotMutation(baseOptions?: Apollo.MutationHookOptions<RemovePracticeBotMutation, RemovePracticeBotMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemovePracticeBotMutation, RemovePracticeBotMutationVariables>(RemovePracticeBotDocument, options);
      }
export type RemovePracticeBotMutationHookResult = ReturnType<typeof useRemovePracticeBotMutation>;
export type RemovePracticeBotMutationResult = Apollo.MutationResult<RemovePracticeBotMutation>;
export type RemovePracticeBotMutationOptions = Apollo.BaseMutationOptions<RemovePracticeBotMutation, RemovePracticeBotMutationVariables>;
export const SetSeatAutoplayDocument = gql`
    mutation SetSeatAutoplay($gameId: String!, $playerToken: String!, $enabled: Boolean!) {
  setAutoplay(gameId: $gameId, playerToken: $playerToken, enabled: $enabled)
}
    `;
export type SetSeatAutoplayMutationFn = Apollo.MutationFunction<SetSeatAutoplayMutation, SetSeatAutoplayMutationVariables>;

/**
 * __useSetSeatAutoplayMutation__
 *
 * To run a mutation, you first call `useSetSeatAutoplayMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetSeatAutoplayMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setSeatAutoplayMutation, { data, loading, error }] = useSetSeatAutoplayMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      enabled: // value for 'enabled'
 *   },
 * });
 */
export function useSetSeatAutoplayMutation(baseOptions?: Apollo.MutationHookOptions<SetSeatAutoplayMutation, SetSeatAutoplayMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetSeatAutoplayMutation, SetSeatAutoplayMutationVariables>(SetSeatAutoplayDocument, options);
      }
export type SetSeatAutoplayMutationHookResult = ReturnType<typeof useSetSeatAutoplayMutation>;
export type SetSeatAutoplayMutationResult = Apollo.MutationResult<SetSeatAutoplayMutation>;
export type SetSeatAutoplayMutationOptions = Apollo.BaseMutationOptions<SetSeatAutoplayMutation, SetSeatAutoplayMutationVariables>;
export const HelpAbsentPlayerDocument = gql`
    mutation HelpAbsentPlayer($gameId: String!, $playerToken: String!, $playerId: String!, $expectedLastSeenAt: Float!) {
  enableAwayAutoplay(
    gameId: $gameId
    playerToken: $playerToken
    playerId: $playerId
    expectedLastSeenAt: $expectedLastSeenAt
  )
}
    `;
export type HelpAbsentPlayerMutationFn = Apollo.MutationFunction<HelpAbsentPlayerMutation, HelpAbsentPlayerMutationVariables>;

/**
 * __useHelpAbsentPlayerMutation__
 *
 * To run a mutation, you first call `useHelpAbsentPlayerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useHelpAbsentPlayerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [helpAbsentPlayerMutation, { data, loading, error }] = useHelpAbsentPlayerMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *      playerId: // value for 'playerId'
 *      expectedLastSeenAt: // value for 'expectedLastSeenAt'
 *   },
 * });
 */
export function useHelpAbsentPlayerMutation(baseOptions?: Apollo.MutationHookOptions<HelpAbsentPlayerMutation, HelpAbsentPlayerMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<HelpAbsentPlayerMutation, HelpAbsentPlayerMutationVariables>(HelpAbsentPlayerDocument, options);
      }
export type HelpAbsentPlayerMutationHookResult = ReturnType<typeof useHelpAbsentPlayerMutation>;
export type HelpAbsentPlayerMutationResult = Apollo.MutationResult<HelpAbsentPlayerMutation>;
export type HelpAbsentPlayerMutationOptions = Apollo.BaseMutationOptions<HelpAbsentPlayerMutation, HelpAbsentPlayerMutationVariables>;
export const LeaveSeatDocument = gql`
    mutation LeaveSeat($gameId: String!, $playerToken: String!) {
  leaveGame(gameId: $gameId, playerToken: $playerToken)
}
    `;
export type LeaveSeatMutationFn = Apollo.MutationFunction<LeaveSeatMutation, LeaveSeatMutationVariables>;

/**
 * __useLeaveSeatMutation__
 *
 * To run a mutation, you first call `useLeaveSeatMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useLeaveSeatMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [leaveSeatMutation, { data, loading, error }] = useLeaveSeatMutation({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useLeaveSeatMutation(baseOptions?: Apollo.MutationHookOptions<LeaveSeatMutation, LeaveSeatMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<LeaveSeatMutation, LeaveSeatMutationVariables>(LeaveSeatDocument, options);
      }
export type LeaveSeatMutationHookResult = ReturnType<typeof useLeaveSeatMutation>;
export type LeaveSeatMutationResult = Apollo.MutationResult<LeaveSeatMutation>;
export type LeaveSeatMutationOptions = Apollo.BaseMutationOptions<LeaveSeatMutation, LeaveSeatMutationVariables>;
export const RecoverSeatDocument = gql`
    query RecoverSeat($gameId: String!, $playerToken: String!) {
  state(gameId: $gameId, playerToken: $playerToken) {
    id
    me {
      id
      name
    }
  }
}
    `;

/**
 * __useRecoverSeatQuery__
 *
 * To run a query within a React component, call `useRecoverSeatQuery` and pass it any options that fit your needs.
 * When your component renders, `useRecoverSeatQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useRecoverSeatQuery({
 *   variables: {
 *      gameId: // value for 'gameId'
 *      playerToken: // value for 'playerToken'
 *   },
 * });
 */
export function useRecoverSeatQuery(baseOptions: Apollo.QueryHookOptions<RecoverSeatQuery, RecoverSeatQueryVariables> & ({ variables: RecoverSeatQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<RecoverSeatQuery, RecoverSeatQueryVariables>(RecoverSeatDocument, options);
      }
export function useRecoverSeatLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<RecoverSeatQuery, RecoverSeatQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<RecoverSeatQuery, RecoverSeatQueryVariables>(RecoverSeatDocument, options);
        }
// @ts-ignore
export function useRecoverSeatSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<RecoverSeatQuery, RecoverSeatQueryVariables>): Apollo.UseSuspenseQueryResult<RecoverSeatQuery, RecoverSeatQueryVariables>;
export function useRecoverSeatSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecoverSeatQuery, RecoverSeatQueryVariables>): Apollo.UseSuspenseQueryResult<RecoverSeatQuery | undefined, RecoverSeatQueryVariables>;
export function useRecoverSeatSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<RecoverSeatQuery, RecoverSeatQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<RecoverSeatQuery, RecoverSeatQueryVariables>(RecoverSeatDocument, options);
        }
export type RecoverSeatQueryHookResult = ReturnType<typeof useRecoverSeatQuery>;
export type RecoverSeatLazyQueryHookResult = ReturnType<typeof useRecoverSeatLazyQuery>;
export type RecoverSeatSuspenseQueryHookResult = ReturnType<typeof useRecoverSeatSuspenseQuery>;
export type RecoverSeatQueryResult = Apollo.QueryResult<RecoverSeatQuery, RecoverSeatQueryVariables>;
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
    mutation NewGame($deckConfig: DeckConfigInput, $pirateAbilities: Boolean, $roundSchedule: [Int!], $tieBreakers: Boolean, $cannonball: Boolean, $scoringMode: ScoringMode) {
  newGame(
    deckConfig: $deckConfig
    pirateAbilities: $pirateAbilities
    scoringMode: $scoringMode
    roundSchedule: $roundSchedule
    tieBreakers: $tieBreakers
    cannonball: $cannonball
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
 *      roundSchedule: // value for 'roundSchedule'
 *      tieBreakers: // value for 'tieBreakers'
 *      cannonball: // value for 'cannonball'
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