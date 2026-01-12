import { Deck } from "./deck";
import { Card, Color, isColoredCard, isSpecialCard } from "./cards";
import { Player } from "./player";
import { assert } from "./utils/assert";
import { Scorecard } from "./scorecard";
import { randomUUID } from "crypto";

export interface Round {
  roundNumber: number;
  phase: "bid" | "play" | "trick_result";
  bids: Map<string, number>;
  cardsPlayed: PlayedCard[];
  dealer: number;
  leader: number;
  trickColor: Color | null;
  tricksWon: Map<string, Card[][]>;
  hands: Hand[];
  lastCompletedHand: Hand | null;
}

export interface Hand {
  id: string;
  trickColor: Color | null;
  cardsPlayed: PlayedCard[];
  winningCard: PlayedCard | null;
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
  private currentRound: Round;
  private endGameListeners: (() => void)[] = [];

  constructor(id: string, options?: GameOptions) {
    this.id = id;
    this.options = options ?? {};
    this.players = [];
    this.playerNames = new Set();
    this.playerTokens = new Map();
    this.deck = options?.deck ?? new Deck();
    this.mode = options?.mode ?? "standard";
    this.phase = "setup";
    this.currentRound = {
      roundNumber: 0,
      phase: "bid",
      bids: new Map(),
      cardsPlayed: [],
      dealer: 0,
      leader: 1,
      trickColor: null,
      tricksWon: new Map(),
      hands: [],
      lastCompletedHand: null,
    };
  }

  public onGameEnd(listener: () => void) {
    this.endGameListeners.push(listener);
  }

  public addPlayer(name: string) {
    if (this.players.length === 6) {
      throw new Error("Can't have more than 6 players");
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
    if (this.players.length > 8) {
      throw Error("A maximum of 8 players can play the game");
    }
    this.scorecard = new Scorecard(this.playerNames);
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
      count <= this.currentRound.roundNumber,
      "Can't bid more than there are cards in the current hand"
    );

    this.currentRound.bids.set(playerId, count);

    if (this.currentRound.bids.size === this.players.length) {
      this.currentRound.phase = "play";
    }
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

    const card = this.deck.getCard(cardId);
    assert(card, "Programming error: Invalid cardId provided");
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

    const cardInHandIndex = player.hand.findIndex((c) => {
      if (isColoredCard(c) && isColoredCard(card)) {
        return c.color === card.color && c.number === card.number;
      } else if (isSpecialCard(c) && isSpecialCard(card)) {
        return c.type === card.type;
      } else {
        return false;
      }
    });
    assert(cardInHandIndex > -1, "Card not found in player's hand");
    assert(this.canPlayCard([...player.hand], cardInHandIndex), "Illegal move");

    if (isSpecialCard(card) && card.type === "tigress") {
      assert(
        selection,
        "Can't play tigress card without providing a selection"
      );
      card.selection = selection;
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
  }

  private maybeSetTrickColor(card: Card) {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { trickColor, cardsPlayed } = this.currentRound;
    if (isSpecialCard(card)) return;
    if (trickColor != null) return;
    if (cardsPlayed.map(({ card }) => card).some(isColoredCard)) return;
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
    const trickWinner = this.determineWinningCard();
    const playersTricks = tricksWon.get(trickWinner.playerId);
    const cardsInTrick = cardsPlayed.map(({ card }) => card);
    if (!playersTricks) {
      tricksWon.set(trickWinner.playerId, [cardsInTrick]);
    } else {
      playersTricks.push(cardsInTrick);
    }

    // Store the completed hand for display during trick_result phase
    const completedHand: Hand = {
      id: randomUUID(),
      trickColor: this.currentRound.trickColor,
      cardsPlayed: this.currentRound.cardsPlayed,
      winningCard: trickWinner,
    };

    this.currentRound.hands = [...this.currentRound.hands, completedHand];
    this.currentRound.lastCompletedHand = completedHand;
    this.currentRound.leader = this.players.findIndex(
      (player) => player.name === trickWinner.playerId
    );

    // Transition to trick_result phase so players can see who won
    this.currentRound.phase = "trick_result";
  }

  // Advance from trick_result phase to continue the game
  public advanceFromTrickResult() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    assert(
      this.currentRound.phase === "trick_result",
      "Can only advance from trick_result phase"
    );

    const { roundNumber, tricksWon } = this.currentRound;

    // Clear the trick for the next hand
    this.currentRound.trickColor = null;
    this.currentRound.cardsPlayed = [];
    this.currentRound.lastCompletedHand = null;

    // Check if round is complete
    if (Array.from(tricksWon.values()).flat().length === roundNumber) {
      this.updateScores();
      this.nextRound();
    } else {
      // Continue to next trick
      this.currentRound.phase = "play";
    }
  }

  private determineWinningCard() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    const { cardsPlayed, trickColor } = this.currentRound;

    // TODO: DRY with below
    const skullKingIndex = cardsPlayed.findIndex(
      ({ card }) => isSpecialCard(card) && card.type === "skullKing"
    );
    if (skullKingIndex > -1) {
      return cardsPlayed[skullKingIndex];
    }

    const firstPiratePlayedIndex = cardsPlayed.findIndex(
      ({ card }) =>
        isSpecialCard(card) &&
        (card.type === "pirate" ||
          (card.type === "tigress" && card.selection === "pirate"))
    );
    if (firstPiratePlayedIndex > -1) {
      return cardsPlayed[firstPiratePlayedIndex];
    }

    // TODO: DRY with below
    const blackCards = cardsPlayed.filter(
      ({ card }) => isColoredCard(card) && card.color === "BLACK"
    );
    if (blackCards.length > 0) {
      const winningCard = blackCards.reduce(
        (nextCard, highestCard) => {
          assert(
            isColoredCard(highestCard.card) && isColoredCard(nextCard.card),
            "Programming error"
          );
          return nextCard.card.number > highestCard.card.number
            ? nextCard
            : highestCard;
        },
        { id: "", playerId: "", card: { id: "", number: 0, color: "BLACK" } }
      );

      return winningCard;
    }

    if (trickColor) {
      const cardsMatchingTrickColor = cardsPlayed.filter(
        ({ card }) => isColoredCard(card) && card.color === trickColor
      );
      const winningCard = cardsMatchingTrickColor.reduce(
        (nextCard, highestCard) => {
          assert(
            isColoredCard(highestCard.card) && isColoredCard(nextCard.card),
            "Programming error"
          );
          return nextCard.card.number > highestCard.card.number
            ? nextCard
            : highestCard;
        },
        { id: "", playerId: "", card: { id: "", number: 0, color: trickColor } }
      );
      return winningCard;
    }

    if (
      cardsPlayed.every(
        ({ card }) =>
          isSpecialCard(card) &&
          (card.type === "escape" ||
            (card.type === "tigress" && card.selection === "escape"))
      )
    ) {
      return cardsPlayed[0];
    }

    throw Error("Programming error, unhandled win condition");
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

  private playerTurn() {
    // Player order for the round
    const order = this.playerOrder();
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    // We can use cards played so far to determine whose turn it is
    const { cardsPlayed } = this.currentRound;
    // Number of cards played correlates to the index of the player whose turn it is from the order array
    const playerTurnIndex = cardsPlayed.length;
    // Get the index of the player which correlates to the actual players array in the game
    const playerTurnIdx = order[playerTurnIndex];
    // Get player from the players array using the lookup
    const player = Array.from(this.playerNames)[playerTurnIdx];

    return player;
  }

  private nextRound() {
    assert(
      this.currentRound,
      "Programming error: `currentRound` is unexpectedly `null`"
    );
    if (this.currentRound.roundNumber === 10) {
      // TODO: implement endGame
      this.endGame();
      return;
    }

    const previousRound = { ...this.currentRound };
    const newRoundNumber = previousRound.roundNumber + 1;
    // -1 is for round number offset (dealer starts at 0, round starts at 1)
    const newDealer = (newRoundNumber - 1) % this.players.length;
    const newLeader = (newDealer + 1) % this.players.length;

    this.currentRound = {
      roundNumber: newRoundNumber,
      phase: "bid",
      bids: new Map(),
      cardsPlayed: [],
      dealer: newDealer,
      leader: newLeader,
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
    const { roundNumber } = this.currentRound;
    const [dealer, ...rest] = this.playerOrder();
    const dealOrder = [...rest, dealer];

    for (let i = 0; i < roundNumber; i++) {
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
    const { leader } = this.currentRound;

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

  private endGame() {
    this.phase = "postgame";
    // Clear currentRound in postgame - game is over
    (this as any).currentRound = null;
    this.endGameListeners.forEach((listener) => listener());
  }

  public getStateForPlayer(playerToken?: string) {
    // In postgame, currentRound is null
    const currentRoundData = this.currentRound ? {
      ...this.currentRound,
      id: this.currentRound.roundNumber,
      myBid: undefined as number | undefined,
      leader: this.players[this.currentRound.leader]?.name ?? null,
      playerTurn: this.playerTurn(),
    } : null;

    const gameState = {
      id: this.id,
      phase: this.phase,
      currentRound: currentRoundData,
      scorecard: this.scorecard?.getScoreCard(),
      options: this.options,
      players: this.players.map((player) => ({
        ...player,
        hand: [],
      })),
      me: undefined as Player | undefined,
    };
    if (playerToken && this.currentRound) {
      const playerName = this.playerTokens.get(playerToken);
      const me = this.players.find((player) => player.name === playerName)!;
      gameState.me = me;
      if (currentRoundData) {
        currentRoundData.myBid = this.currentRound.bids.get(me.name);
      }
    } else if (playerToken) {
      const playerName = this.playerTokens.get(playerToken);
      const me = this.players.find((player) => player.name === playerName)!;
      gameState.me = me;
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

interface GameOptions {
  mode?: "standard";
  deck?: Deck;
}
