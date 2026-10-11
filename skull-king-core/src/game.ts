import { chooseBotAction, BotView } from "./botPolicy";
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
import { determineTrickWinner, defersLeadSuit } from "./trickRules";
import { createPirateAbility, PirateAbility, PirateAbilityInput, pirateAbilityForPlayer, resolvePirateAbility } from "./pirateAbilities";

import { declareExpansionCard, expansionTurnOrder, PlankChoice, preparePlankChoice } from "./expansion";

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
  pirateAbilityQueue?: PirateAbility[];
  forcedCards?: Map<string, string>;
  volleyPlayerId?: string;
  plankChoice?: PlankChoice | null;
  removedCardIds?: string[];
}

export interface Hand {
  id: string;
  trickColor: Color | null;
  cardsPlayed: PlayedCard[];
  winningCard: PlayedCard | null;
  trickDiscarded?: boolean;
  removedCardIds?: string[];
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
  private autoplayPlayers = new Set<string>();
  private lastSeen = new Map<string, number>();
  private practice = false;
  private nextGameId: string | null = null;
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
    game.autoplayPlayers ??= new Set();
    game.lastSeen ??= new Map();
    game.practice ??= false;
    return game;
  }

  public createRematch(id: string): Game {
    assert(this.phase === "postgame", "Finish this voyage before starting a rematch");
    assert(!this.nextGameId, "A rematch already exists");
    const next = new Game(id, { ...this.options, deck: undefined });
    next.players = this.players.filter(player => !player.isAutomated).map(player => ({ ...player, hand: [] }));
    next.playerNames = new Set(this.playerNames);
    next.playerTokens = new Map(this.playerTokens);
    next.autoplayPlayers = new Set(next.players.filter(player => player.isBot).map(player => player.id));
    next.practice = next.autoplayPlayers.size > 0;
    next.resetPresence();
    this.nextGameId = id;
    return next;
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
      this.lastSeen.set(name, Date.now());
      return token;
    }
  }

  private humanForToken(token: string) {
    const id = this.playerTokens.get(token);
    const player = this.players.find(player => player.id === id && !player.isBot && !player.isAutomated);
    assert(player, "A human seat is required");
    return player;
  }

  private hostForToken(token: string) {
    const player = this.humanForToken(token);
    assert(player.id === this.players.find(player => !player.isBot && !player.isAutomated)?.id, "Only the host can do that");
    return player;
  }

  public recordPresence(token: string, now = Date.now()) {
    const id = this.playerTokens.get(token);
    if (!this.players.some(player => player.id === id && !player.isBot && !player.isAutomated)) return false;
    this.lastSeen.set(id!, now);
    return true;
  }

  public resetPresence(now = Date.now()) {
    for (const player of this.players) if (!player.isBot && !player.isAutomated) this.lastSeen.set(player.id, now);
  }

  public addBot(hostToken: string) {
    this.hostForToken(hostToken);
    assert(this.phase === "setup", "Add practice players in the lobby");
    let number = 1;
    while (this.playerNames.has(`Practice pirate ${number}`)) number++;
    const name = `Practice pirate ${number}`;
    this.addPlayer(name);
    this.players.find(player => player.id === name)!.isBot = true;
    this.lastSeen.delete(name);
    this.autoplayPlayers.add(name);
    this.practice = true;
    return name;
  }

  public removeBot(hostToken: string, playerId: string) {
    this.hostForToken(hostToken);
    assert(this.phase === "setup", "Remove practice players in the lobby");
    assert(this.players.some(player => player.id === playerId && player.isBot), "Choose a practice player");
    this.removeSeat(playerId);
    return true;
  }

  private removeSeat(id: string) {
    this.players = this.players.filter(player => player.id !== id);
    this.playerNames.delete(id); this.autoplayPlayers.delete(id); this.lastSeen.delete(id);
    for (const [token, playerId] of this.playerTokens) if (playerId === id) this.playerTokens.delete(token);
  }

  public setAutoplay(token: string, enabled: boolean) {
    assert(typeof enabled === "boolean", "Choose whether autoplay is enabled");
    const player = this.humanForToken(token);
    assert(this.phase === "play", "Autoplay is available during a match");
    if (enabled) { this.autoplayPlayers.add(player.id); this.practice = true; }
    else { this.autoplayPlayers.delete(player.id); this.recordPresence(token); }
    return true;
  }

  public enableAwayAutoplay(hostToken: string, playerId: string, expectedLastSeenAt: number, now = Date.now()) {
    this.hostForToken(hostToken);
    assert(this.phase === "play", "Autoplay is available during a match");
    assert(this.players.some(player => player.id === playerId && !player.isBot && !player.isAutomated), "Choose a human player");
    const lastSeen = this.lastSeen.get(playerId);
    if (lastSeen !== expectedLastSeenAt || this.autoplayPlayers.has(playerId)) return false;
    assert(lastSeen != null && now - lastSeen >= 90_000, "Wait until this player has been absent for 90 seconds");
    this.autoplayPlayers.add(playerId); this.practice = true;
    return true;
  }

  public leaveGame(token: string) {
    const player = this.humanForToken(token);
    if (this.phase === "setup") this.removeSeat(player.id);
    else if (this.phase === "play") this.setAutoplay(token, true);
    return true;
  }

  /** Executes one decision from an explicitly filtered view. Tokens stay inside Game. */
  public stepAutoplay() {
    const round = this.currentRound;
    if (this.phase !== "play" || !round) return false;
    let actor = round.plankChoice?.playerId ?? round.pirateAbility?.playerId ?? this.playerTurn();
    if (round.phase === "bid") actor = this.players.find(player => this.autoplayPlayers.has(player.id) && !round.bids.has(player.id))?.id ?? null;
    if (round.phase === "load") actor = this.players.find(player => this.autoplayPlayers.has(player.id) && !round.cannonLoads?.has(player.id))?.id ?? null;
    if (!actor || !this.autoplayPlayers.has(actor)) return false;
    const token = [...this.playerTokens].find(([, id]) => id === actor)?.[0];
    assert(token, "Autoplay seat has no credential");
    const state = this.getStateForPlayer(token);
    const visible = state.currentRound!;
    const view: BotView = {
      playerId: actor, hand: state.me!.hand.map(card => ({ ...card })), legalCardIds: state.legalCardIds,
      phase: visible.phase, bid: visible.myBid, tricksWon: state.me!.tricksWon,
      cardsPerPlayer: visible.cardsPerPlayer, trickColor: visible.trickColor, forcedCardId: visible.myForcedCardId,
      players: state.players.map(player => ({ id: player.id, handCount: player.handCount })),
      ability: visible.pirateAbility ? { id: visible.pirateAbility.id, kind: visible.pirateAbility.kind, stage: visible.pirateAbility.stage, canDecline: visible.pirateAbility.canDecline } : null,
      plankChoice: visible.plankChoice ? { id: visible.plankChoice.id, cardIds: [...visible.plankChoice.cardIds] } : null,
    };
    const action = chooseBotAction(view);
    if (!action) return false;
    if (action.kind === "bid") this.submitBid({ playerToken: token, count: action.count });
    else if (action.kind === "load") this.loadCannon({ playerToken: token, load: "grapeshot", expectedRoundNumber: round.roundNumber });
    else if (action.kind === "play") this.playCard({ playerToken: token, ...action });
    else if (action.kind === "ability") this.usePirateAbility(token, action.id, action.input);
    else this.choosePlankTarget(token, action.id, action.cardId);
    return true;
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
    this.resetPresence();
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
    numberChoice,
    colorChoice,
  }: {
    playerToken: string;
    cardId: string;
    selection?: "escape" | "pirate";
    numberChoice?: number;
    colorChoice?: Color;
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
    declareExpansionCard(card, this.currentRound.trickColor, numberChoice, colorChoice);
    this.currentRound.forcedCards?.delete(playerId);
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
    const order = expansionTurnOrder(this.currentRound, this.playerOrder(), this.players.map(player => player.id));
    if (order.length) this.currentRound.leader = order[0];
    this.playGraybeardIfNext();
  }

  private playGraybeardIfNext() {
    while (this.currentRound?.phase === "play") {
      const player = this.players.find((candidate) => candidate.name === this.playerTurn());
      if (!player?.isAutomated) return;
      const forced = this.currentRound.forcedCards?.get(player.id);
      const index = forced ? player.hand.findIndex(card => card.id === forced) : 0;
      const [topCard] = player.hand.splice(index, 1);
      assert(topCard, "Graybeard has no card to reveal");
      this.currentRound.forcedCards?.delete(player.id);
      const card = graybeardCard(topCard);
      this.maybeSetTrickColor(card);
      this.currentRound.cardsPlayed.push({ id: `${player.id}-${card.id}`, playerId: player.id, card });
      this.maybeEndHand();
    }
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
    if (!cardsPlayed.every(({ card }) => defersLeadSuit(card))) return;
    this.currentRound.trickColor = card.color;
  }

  private maybeEndHand() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { cardsPlayed, tricksWon } = this.currentRound;
    const turns = expansionTurnOrder(this.currentRound, this.playerOrder(), this.players.map((player) => player.id));
    if (cardsPlayed.length < turns.length) return;
    preparePlankChoice(this.currentRound);
    if (this.currentRound.plankChoice) return;
    const volley = cardsPlayed.find(({card}) => isSpecialCard(card) && card.type === "lastVolley");
    if (volley && this.currentRound.hands.length + 1 < this.currentRound.cardsPerPlayer) this.currentRound.volleyPlayerId = volley.playerId;

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
      removedCardIds: this.currentRound.removedCardIds,
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

  public choosePlankTarget(playerToken: string, expectedChoiceId: string, cardId: string) {
    const actor = this.playerTokens.get(playerToken);
    assert(actor, "Invalid player token");
    const round = this.currentRound;
    const choice = round?.plankChoice;
    if (!round || !choice || choice.id !== expectedChoiceId) return false;
    assert(choice.playerId === actor, "Only the player of Walk the Plank may choose");
    assert(choice.cardIds.includes(cardId), "Choose a Pirate from this trick");
    round.removedCardIds = [cardId];
    round.plankChoice = null;
    this.maybeEndHand();
    return true;
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
    this.currentRound.removedCardIds = undefined;

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
    return determineTrickWinner(this.currentRound.cardsPlayed, this.currentRound.trickColor, this.currentRound.removedCardIds);
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
    const actor = this.playerTurn();
    const forced = actor ? this.currentRound.forcedCards?.get(actor) : undefined;
    if (forced) return card.id === forced;
    if (isColoredCard(card) && card.wild && trickColor !== "BLACK") return true;
    // Can always play a special card
    if (isSpecialCard(card)) return true;
    // Can play anything if no trick color is set
    if (trickColor === null) return true;
    // Can always play a card that matches the trick color
    if (card.color === trickColor) return true;
    // Can play anything if you don't have a card of the trick color
    if (hand.every((card) => isSpecialCard(card) || (card.color !== trickColor && !(card.wild && trickColor !== "BLACK"))))
      return true;
    return false;
  }

  private isPlayersTurn(playerId: string) {
    const player = this.playerTurn();
    return player === playerId;
  }

  private playerTurn(): string | null {
    if (this.currentRound?.phase !== "play" || this.currentRound.plankChoice) return null;
    const order = expansionTurnOrder(this.currentRound, this.playerOrder(), this.players.map((player) => player.id));
    const playerIndex = order[this.currentRound.cardsPlayed.length];
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
      myForcedCardId: this.currentRound.forcedCards?.get(this.playerTokens.get(playerToken ?? "") ?? "") ?? null,
      leader: this.players[this.currentRound.leader]?.name ?? null,
      playerTurn: this.playerTurn(),
      pirateAbility: pirateAbilityForPlayer(this.currentRound, playerToken ? this.playerTokens.get(playerToken) : undefined, this.deck),
    } : null;

    const publicPlayer = (player: Player, showHand = false) => ({
      ...player,
      hand: showHand ? player.hand : [],
      handCount: player.hand.length,
      isAutomated: player.isAutomated ?? false,
      isBot: player.isBot ?? false,
      isAutoplay: this.autoplayPlayers.has(player.id),
      lastSeenAt: player.isBot || player.isAutomated ? null : this.lastSeen.get(player.id) ?? null,
      bid: this.currentRound && this.currentRound.phase !== "bid" ? this.currentRound.bids.get(player.id) ?? null : null,
      tricksWon: this.currentRound?.tricksWon.get(player.id)?.length ?? 0,
    });
    const gameState = {
      id: this.id,
      nextGameId: this.nextGameId ?? null,
      practice: this.practice,
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
        includeExpansion: this.options.deckConfig?.includeExpansion ?? false,
        includeFirstMate: this.options.deckConfig?.includeFirstMate ?? false,
        includeStingray: this.options.deckConfig?.includeStingray ?? false,
        includeDavyJones: this.options.deckConfig?.includeDavyJones ?? false,
        includeWalkThePlank: this.players.some(player => player.isAutomated) ? false : this.options.deckConfig?.includeWalkThePlank ?? false,
        includeLastVolley: this.options.deckConfig?.includeLastVolley ?? false,
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
