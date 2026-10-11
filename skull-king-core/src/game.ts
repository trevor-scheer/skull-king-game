import { types } from "node:util";
import { serialize, deserialize } from "node:v8";
import { Deck } from "./deck";
import { Card, Color, DeckConfiguration, isColoredCard, isSpecialCard } from "./cards";
import { Player } from "./player";
import { allowedWithGraybeard, createGraybeard, graybeardCard, graybeardTurnOrder } from "./graybeard";
import { assert } from "./utils/assert";
import { Scorecard } from "./scorecard";
import { ScoringMode, CannonLoad } from "./scoring";
import { cardsForRound, hasTiedLeaders, validateRoundSchedule } from "./roundOptions";
import { randomUUID } from "crypto";
import { determineTrickWinner, isEscapeCard } from "./trickRules";
import { createPirateAbility, PirateAbility, PirateAbilityInput, pirateAbilityForPlayer, resolvePirateAbility } from "./pirateAbilities";

export interface Round {
  roundNumber: number;
  cardsPerPlayer: number;
  isTieBreaker: boolean;
  cannonLoads?: Map<string, CannonLoad>;
  phase: "bid" | "load" | "play" | "trick_result";
  bids: Map<string, number>;
  cardsPlayed: PlayedCard[];
  dealer: number;
  roundLeader?: number;
  leader: number;
  trickColor: Color | null;
  tricksWon: Map<string, Card[][]>;
  hands: Hand[];
  lastCompletedHand: Hand | null;
  pirateAbility?: PirateAbility | null;
  pirateWagers?: Map<string, number>;
}

export interface Hand {
  id: string;
  trickColor: Color | null;
  cardsPlayed: PlayedCard[];
  winningCard: PlayedCard | null;
  trickDiscarded?: boolean;
}

export interface PlayedCard {
  id: string;
  playerId: string;
  card: Card;
}
export class Game {
  private id: String;
  private players: Player[];
  private playerNames: Set<string>;
  private playerTokens: Map<string, string>;
  private deck: Deck;
  private scorecard?: Scorecard;
  private options: GameOptions;
  private mode: "standard";
  private phase: "setup" | "play" | "postgame";
  private currentRound: Round | null;
  private endGameListeners: (() => void)[] = [];

  constructor(id: string, options?: GameOptions) {
    this.id = id;
    this.options = { ...options, roundSchedule: validateRoundSchedule(options?.roundSchedule ?? undefined) };
    assert(!options?.cannonball || options.scoringMode === "rascal", "Cannonball requires Rascal scoring");
    assert(
      options?.scoringMode == null || options.scoringMode === "classic" || options.scoringMode === "rascal",
      "Unknown scoring mode"
    );
    this.players = [];
    this.playerNames = new Set();
    this.playerTokens = new Map();
    this.deck = options?.deck ?? new Deck({ deckConfig: options?.deckConfig });
    this.mode = options?.mode ?? "standard";
    this.phase = "setup";
    this.currentRound = null;
  }

  /** Private server checkpoint. Never send this payload to a client. */
  public checkpoint(): Buffer {
    return serialize({ version: 1, game: { ...this, endGameListeners: [] } });
  }

  public static restoreCheckpoint(payload: Uint8Array): Game {
    const saved = deserialize(payload);
    assert(saved?.version === 1 && types.isMap(saved.game?.playerTokens), "Unsupported game checkpoint");
    const game = Object.setPrototypeOf(saved.game, Game.prototype) as Game;
    Object.setPrototypeOf(game.deck, Deck.prototype);
    if (game.options.deck) Object.setPrototypeOf(game.options.deck, Deck.prototype);
    if (game.scorecard) Object.setPrototypeOf(game.scorecard, Scorecard.prototype);
    game.endGameListeners = [];
    return game;
  }

  public onGameEnd(listener: () => void) {
    this.endGameListeners.push(listener);
  }

  public addPlayer(name: string) {
    assert(this.phase === "setup", "Can't join a game after it has started");
    assert(name.trim().length > 0, "Player name can't be blank");
    if (this.players.length >= this.maxPlayers()) {
      throw new Error(`Can't have more than ${this.maxPlayers()} players`);
    } else if (this.playerNames.has(name)) {
      throw new Error(`Name "${name}" is already in use`);
    } else {
      this.playerNames.add(name);
      this.players.push({ name, id: name, hand: [] });
      const token = randomUUID();
      this.playerTokens.set(token, name);
      return token;
    }
  }

  public start() {
    if (this.phase !== "setup") {
      throw Error("Can't start an already started game");
    }
    if (this.players.length < 2) {
      throw Error("At least 2 players required to start the game");
    }
    assert(this.players.length <= this.maxPlayers(), "Too many players for this deck");
    if (this.players.length === 2 && this.options.twoPlayerMode !== "duel") {
      this.deck.retainCards(allowedWithGraybeard);
      this.players.push(createGraybeard(this.players));
    }
    cardsForRound(this.options.roundSchedule!, 1, this.deck.size, this.players.length);
    this.scorecard = new Scorecard(this.playerNames, this.options.scoringMode ?? "classic");
    this.phase = "play";
    this.nextRound();
  }

  // @throws
  public submitBid({
    playerToken,
    count,
  }: {
    playerToken: string;
    count: number;
  }) {
    const playerId = this.playerTokens.get(playerToken);
    assert(playerId, "Invalid player token");
    assert(this.phase === "play", "Can't submit bid during this game phase");
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    assert(!this.currentRound.bids.has(playerId), "Can't place multiple bids");
    assert(
      this.currentRound.phase === "bid",
      "Can't place bids outside of bid phase"
    );
    assert(
      Number.isInteger(count) && count >= 0,
      "Bid must be a nonnegative integer"
    );
    assert(
      count <= this.currentRound.cardsPerPlayer,
      "Can't bid more than there are cards in the current hand"
    );

    this.currentRound.bids.set(playerId, count);

    if (this.currentRound.bids.size === this.playerNames.size) {
      if (this.options.cannonball) this.currentRound.phase = "load";
      else this.beginRoundPlay();
    }
  }

  public loadCannon({ playerToken, load, expectedRoundNumber }: { playerToken: string; load: CannonLoad; expectedRoundNumber: number }) {
    const playerId = this.playerTokens.get(playerToken);
    assert(playerId, "Invalid player token");
    assert(this.options.cannonball, "Cannonball choices are disabled");
    if (this.currentRound?.roundNumber !== expectedRoundNumber || this.currentRound.cannonLoads?.has(playerId)) return false;
    assert(this.currentRound.phase === "load", "Choose a cannon load after bidding");
    assert(load === "grapeshot" || load === "cannonball", "Unknown cannon load");
    this.currentRound.cannonLoads ??= new Map();
    this.currentRound.cannonLoads.set(playerId, load);
    if (this.currentRound.cannonLoads.size === this.playerNames.size) this.beginRoundPlay();
    return true;
  }

  // @throws
  public playCard({
    playerToken,
    cardId,
    selection,
  }: {
    playerToken: string;
    cardId: string;
    selection?: "escape" | "pirate";
  }) {
    const playerId = this.playerTokens.get(playerToken);

    const deckCard = this.deck.getCard(cardId);
    assert(deckCard, "Programming error: Invalid cardId provided");
    const card = { ...deckCard };
    assert(playerId, "Invalid player token provided");
    assert(this.phase === "play", "Can't play a card during this game phase");
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    assert(
      this.currentRound.phase === "play",
      "Can't play cards outside of play phase"
    );
    assert(this.isPlayersTurn(playerId), "Can't play out of turn");

    const player = this.players.find((p) => p.name === playerId);
    assert(player, "Programming error, player not found");

    const cardInHandIndex = player.hand.findIndex((c) => c.id === cardId);
    assert(cardInHandIndex > -1, "Card not found in player's hand");
    assert(this.canPlayCard([...player.hand], cardInHandIndex), "Illegal move");

    if (isSpecialCard(card) && card.type === "tigress") {
      assert(
        selection,
        "Can't play tigress card without providing a selection"
      );
      assert(
        selection === "pirate" || selection === "escape",
        "Tigress selection must be pirate or escape"
      );
      card.selection = selection;
    } else {
      assert(selection == null, "Only Tigress can have a selection");
    }
    // Remove card from player hand
    player.hand.splice(cardInHandIndex, 1);
    // Set the trick color if necessary
    this.maybeSetTrickColor(card);

    this.currentRound.cardsPlayed.push({
      id: `${playerId}-${card.id}`,
      playerId,
      card,
    });

    this.maybeEndHand();
    this.playGraybeardIfNext();
  }

  private beginRoundPlay() {
    assert(this.currentRound, "No active round");
    this.currentRound.phase = "play";
    this.playGraybeardIfNext();
  }

  private playGraybeardIfNext() {
    if (this.currentRound?.phase !== "play") return;
    const player = this.players.find((candidate) => candidate.name === this.playerTurn());
    if (!player?.isAutomated) return;
    const topCard = player.hand.shift();
    assert(topCard, "Graybeard has no card to reveal");
    const card = graybeardCard(topCard);
    this.maybeSetTrickColor(card);
    this.currentRound.cardsPlayed.push({ id: `${player.id}-${card.id}`, playerId: player.id, card });
    this.maybeEndHand();
  }

  private maybeSetTrickColor(card: Card) {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { trickColor, cardsPlayed } = this.currentRound;
    if (isSpecialCard(card) && card.type === "kraken") {
      this.currentRound.trickColor = null;
      return;
    }
    if (isSpecialCard(card)) return;
    if (trickColor != null) return;
    if (!cardsPlayed.every(({ card }) => isEscapeCard(card))) return;
    this.currentRound.trickColor = card.color;
  }

  private maybeEndHand() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { cardsPlayed, tricksWon } = this.currentRound;
    if (cardsPlayed.length < this.players.length) return;

    // End hand - determine winner and store result
    const { winner: trickWinner, trickDiscarded } = this.determineWinningCard();

    // Only award the trick if it wasn't discarded (by Kraken or White Whale)
    if (!trickDiscarded) {
      const playersTricks = tricksWon.get(trickWinner.playerId);
      const cardsInTrick = cardsPlayed.map(({ card }) => card);
      if (!playersTricks) {
        tricksWon.set(trickWinner.playerId, [cardsInTrick]);
      } else {
        playersTricks.push(cardsInTrick);
      }
    }

    // Store the completed hand for display during trick_result phase
    const completedHand: Hand = {
      id: randomUUID(),
      trickColor: this.currentRound.trickColor,
      cardsPlayed: this.currentRound.cardsPlayed,
      winningCard: trickDiscarded ? null : trickWinner,
      trickDiscarded,
    };

    this.currentRound.hands = [...this.currentRound.hands, completedHand];
    this.currentRound.lastCompletedHand = completedHand;
    // The winner (or would-be winner for discarded tricks) leads the next trick
    this.currentRound.leader = this.players.findIndex(
      (player) => player.name === trickWinner.playerId
    );

    // Transition to trick_result phase so players can see who won
    this.currentRound.phase = "trick_result";
    if (this.options.pirateAbilities) {
      const winnerIsAutomated = this.players.some((player) => player.isAutomated && player.id === trickWinner.playerId);
      this.currentRound.pirateAbility = winnerIsAutomated ? null : createPirateAbility(this.currentRound);
    }
  }

  public usePirateAbility(playerToken: string, expectedAbilityId: string, input: PirateAbilityInput) {
    const actor = this.playerTokens.get(playerToken);
    assert(actor, "Invalid player token");
    assert(this.options.pirateAbilities, "Pirate abilities are disabled");
    if (!this.currentRound) return false;
    return resolvePirateAbility(this.currentRound, this.players, this.deck, actor, expectedAbilityId, input);
  }

  // Advance from trick_result phase to continue the game
  public advanceFromTrickResult(expectedHandId?: string) {
    if (this.currentRound?.pirateAbility) return false;
    if (expectedHandId !== undefined && (
      this.currentRound?.phase !== "trick_result" ||
      this.currentRound.lastCompletedHand?.id !== expectedHandId
    )) {
      return false;
    }
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    assert(
      this.currentRound.phase === "trick_result",
      "Can only advance from trick_result phase"
    );

    const { cardsPerPlayer, hands } = this.currentRound;

    // Clear the trick for the next hand
    this.currentRound.trickColor = null;
    this.currentRound.cardsPlayed = [];
    this.currentRound.lastCompletedHand = null;

    // Check if round is complete (based on number of hands played, not tricks won,
    // since Kraken/White Whale can discard tricks)
    if (hands.length === cardsPerPlayer) {
      this.updateScores();
      this.nextRound();
    } else {
      // Continue to next trick
      this.beginRoundPlay();
    }
    return true;
  }

  private determineWinningCard() {
    assert(this.currentRound, "No active round");
    return determineTrickWinner(this.currentRound.cardsPlayed, this.currentRound.trickColor);
  }

  private updateScores() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    this.scorecard?.scoreRound(this.currentRound);
  }

  private canPlayCard(hand: Card[], cardIndex: number) {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { trickColor } = this.currentRound;
    const [card] = hand.splice(cardIndex, 1);
    // Can always play a special card
    if (isSpecialCard(card)) return true;
    // Can play anything if no trick color is set
    if (trickColor === null) return true;
    // Can always play a card that matches the trick color
    if (card.color === trickColor) return true;
    // Can play anything if you don't have a card of the trick color
    if (hand.every((card) => isSpecialCard(card) || card.color !== trickColor))
      return true;
    return false;
  }

  private isPlayersTurn(playerId: string) {
    const player = this.playerTurn();
    return player === playerId;
  }

  private playerTurn(): string | null {
    if (this.currentRound?.phase !== "play") return null;
    const playerIndex = this.playerOrder()[this.currentRound.cardsPlayed.length];
    return this.players[playerIndex]?.name ?? null;
  }

  private nextRound() {
    const schedule = this.options.roundSchedule!;
    if (this.currentRound && this.currentRound.roundNumber >= schedule.length &&
      (this.options.tieBreakers === false || !hasTiedLeaders([...this.playerNames].map(name => this.scorecard!.getPlayerScore(name))))) {
      this.endGame();
      return;
    }

    const newRoundNumber = (this.currentRound?.roundNumber ?? 0) + 1;
    // -1 is for round number offset (dealer starts at 0, round starts at 1)
    const newDealer = (newRoundNumber - 1) % this.playerNames.size;
    const newLeader = (newDealer + 1) % this.playerNames.size;

    this.currentRound = {
      roundNumber: newRoundNumber,
      cardsPerPlayer: cardsForRound(schedule, newRoundNumber, this.deck.size, this.players.length),
      isTieBreaker: newRoundNumber > schedule.length,
      phase: "bid",
      bids: new Map(),
      cardsPlayed: [],
      dealer: newDealer,
      leader: newLeader,
      ...(this.players.some((player) => player.isAutomated) ? { roundLeader: newLeader } : {}),
      trickColor: null,
      tricksWon: new Map(),
      hands: [],
      lastCompletedHand: null,
    };

    this.shuffle();
    this.deal();
  }

  private shuffle() {
    this.deck.shuffle();
  }

  private deal() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { cardsPerPlayer } = this.currentRound;
    const [dealer, ...rest] = this.playerOrder();
    const dealOrder = [...rest, dealer];

    for (let i = 0; i < cardsPerPlayer; i++) {
      for (let playerIdx of dealOrder) {
        this.players[playerIdx].hand.push(this.deck.draw());
      }
    }
  }

  private playerOrder() {
    const playerOrder: number[] = [];
    const { players } = this;

    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { leader, roundLeader } = this.currentRound;
    const ghostOrder = graybeardTurnOrder(players, leader, roundLeader ?? leader);
    if (ghostOrder) return ghostOrder;

    playerOrder.push(leader);
    while (playerOrder.length < players.length) {
      const lastPlayerAdded = playerOrder[playerOrder.length - 1];
      if (lastPlayerAdded === players.length - 1) {
        playerOrder.push(0);
      } else {
        playerOrder.push(lastPlayerAdded + 1);
      }
    }

    return playerOrder;
  }

  private maxPlayers() {
    return this.deck.getCard("wild-15") ? 9 : 8;
  }

  private endGame() {
    this.phase = "postgame";
    // Clear currentRound in postgame - game is over
    this.currentRound = null;
    this.endGameListeners.forEach((listener) => listener());
  }

  public getStateForPlayer(playerToken?: string) {
    // In postgame, currentRound is null
    const currentRoundData = this.currentRound ? {
      ...this.currentRound,
      id: this.currentRound.roundNumber,
      myBid: undefined as number | undefined,
      myCannonLoad: null as CannonLoad | null,
      cannonLoads: undefined,
      revealedBids: this.currentRound.phase === "bid" ? [] : [...this.currentRound.bids].map(([playerId, count]) => ({ playerId, count })),
      revealedCannonLoads: this.currentRound.phase === "bid" || this.currentRound.phase === "load" ? [] : [...(this.currentRound.cannonLoads ?? [])].map(([playerId, load]) => ({ playerId, load })),
      leader: this.players[this.currentRound.leader]?.name ?? null,
      playerTurn: this.playerTurn(),
      pirateAbility: pirateAbilityForPlayer(this.currentRound, playerToken ? this.playerTokens.get(playerToken) : undefined, this.deck),
    } : null;

    const publicPlayer = (player: Player, showHand = false) => ({
      ...player,
      hand: showHand ? player.hand : [],
      handCount: player.hand.length,
      isAutomated: player.isAutomated ?? false,
      bid: this.currentRound && this.currentRound.phase !== "bid" ? this.currentRound.bids.get(player.id) ?? null : null,
      tricksWon: this.currentRound?.tricksWon.get(player.id)?.length ?? 0,
    });
    const gameState = {
      id: this.id,
      phase: this.phase,
      currentRound: currentRoundData,
      scorecard: this.scorecard?.getScoreCard(),
      options: this.options,
      pirateAbilities: this.options.pirateAbilities ?? false,
      deckConfig: {
        includeMermaids: this.options.deckConfig?.includeMermaids ?? true,
        includeKraken: this.options.deckConfig?.includeKraken ?? false,
        includeWhiteWhale: this.options.deckConfig?.includeWhiteWhale ?? false,
        includeLoot: this.players.some((player) => player.isAutomated) ? false : this.options.deckConfig?.includeLoot ?? false,
      },
      scoringMode: this.options.scoringMode ?? "classic",
      roundSchedule: [...this.options.roundSchedule!],
      tieBreakers: this.options.tieBreakers ?? true,
      cannonball: this.options.cannonball ?? false,
      maxPlayers: this.maxPlayers(),
      players: this.players.map((player) => publicPlayer(player)),
      me: undefined as ReturnType<typeof publicPlayer> | undefined,
      legalCardIds: [] as string[],
    };
    if (playerToken) {
      const playerName = this.playerTokens.get(playerToken);
      const me = this.players.find((player) => player.name === playerName);
      gameState.me = me ? publicPlayer(me, true) : undefined;
      if (me && this.currentRound?.phase === "play" && this.isPlayersTurn(me.id)) {
        gameState.legalCardIds = me.hand.filter((_card, index) => this.canPlayCard([...me.hand], index)).map((card) => card.id);
      }
      if (me && currentRoundData && this.currentRound) {
        currentRoundData.myBid = this.currentRound.bids.get(me.name);
        currentRoundData.myCannonLoad = this.currentRound.cannonLoads?.get(me.name) ?? null;
      }
    }

    return gameState;
  }

  public __debugDump() {
    return {
      id: this.id,
      phase: this.phase,
      players: this.players,
      currentRound: this.currentRound,
      deck: this.deck,
      scorecard: this.scorecard,
      options: this.options,
    };
  }
}

export interface GameOptions {
  roundSchedule?: number[];
  tieBreakers?: boolean;
  cannonball?: boolean;
  twoPlayerMode?: "graybeard" | "duel";
  scoringMode?: ScoringMode;
  mode?: "standard";
  deck?: Deck;
  deckConfig?: DeckConfiguration;
  pirateAbilities?: boolean;
}
