import { Deck } from "./deck";
import { Card, Color, isColoredCard, isSpecialCard } from "./cards";
import { Player } from "./player";
import { assert } from "./utils/assert";
import { Scorecard } from "./scorecard";

export interface CurrentRound {
  roundNumber: number;
  phase: "bid" | "play";
  bids: Map<string, number>;
  cardsPlayed: { playerId: string; card: Card }[];
  dealer: number;
  leader: number;
  trickColor: Color | null;
  tricksWon: Map<string, Card[][]>;
}
export class Game {
  private players: Player[];
  private playerNames: Set<string>;
  private deck: Deck;
  private scorecard?: Scorecard;
  private options: GameOptions;
  private mode: "standard";
  private phase: "setup" | "play" | "postgame";
  private currentRound: CurrentRound;

  constructor(options?: GameOptions) {
    this.options = options ?? {};
    this.players = [];
    this.playerNames = new Set();
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
    };
  }

  public addPlayer(name: string) {
    if (this.players.length === 6) {
      throw new Error("Can't have more than 6 players");
    } else if (this.playerNames.has(name)) {
      throw new Error(`Name "${name}" is already in use`);
    } else {
      this.playerNames.add(name);
      this.players.push({ name, hand: [] });
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
  public submitBid({ playerId, count }: { playerId: string; count: number }) {
    if (this.phase !== "play") {
      throw Error("Can't submit bid during this game mode");
    } else if (this.currentRound.bids.has(playerId)) {
      throw Error("Can't place multiple bids");
    } else if (this.currentRound.phase !== "bid") {
      // TODO: untested branch
      throw Error("Can't place bids outside of bid phase");
    } else if (count > this.currentRound.roundNumber) {
      throw Error("Can't bid more than there are cards in the current hand");
    } else {
      this.currentRound.bids.set(playerId, count);
    }

    if (this.currentRound.bids.size === this.players.length) {
      this.currentRound.phase = "play";
    }
  }

  // @throws
  public playCard({ playerId, card }: { playerId: string; card: Card }) {
    assert(this.phase === "play", "Can't play a card during this game phase");
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
    assert(cardInHandIndex > -1, "Programming error, card not found");
    assert(this.canPlayCard([...player.hand], cardInHandIndex), "Illegal move");

    // Remove card from player hand
    player.hand.splice(cardInHandIndex, 1);
    // Set the trick color if necessary
    this.maybeSetTrickColor(card);

    this.currentRound.cardsPlayed.push({ playerId, card });

    this.maybeEndHand();
  }

  private maybeSetTrickColor(card: Card) {
    const { trickColor, cardsPlayed } = this.currentRound;
    if (isSpecialCard(card)) return;
    if (trickColor != null) return;
    if (cardsPlayed.map(({ card }) => card).some(isColoredCard)) return;
    this.currentRound.trickColor = card.color;
  }

  private maybeEndHand() {
    const { cardsPlayed, roundNumber, tricksWon } = this.currentRound;
    if (cardsPlayed.length < this.players.length) return;

    // End hand
    const trickWinner = this.determineWinningCard();
    const playersTricks = tricksWon.get(trickWinner);
    const cardsInTrick = cardsPlayed.map(({ card }) => card);
    if (!playersTricks) {
      tricksWon.set(trickWinner, [cardsInTrick]);
    } else {
      playersTricks.push(cardsInTrick);
    }

    this.currentRound.cardsPlayed = [];
    this.currentRound.leader = this.players.findIndex(
      (player) => player.name === trickWinner
    );

    // end round
    if (Array.from(tricksWon.values()).flat().length === roundNumber) {
      this.updateScores();
      this.nextRound();
    }
  }

  private determineWinningCard() {
    let winner: string | null = null;
    const { cardsPlayed, trickColor } = this.currentRound;

    // TODO: DRY with below
    const skullKingIndex = cardsPlayed.findIndex(
      ({ card }) => isSpecialCard(card) && card.type === "skullKing"
    );
    if (skullKingIndex > -1) {
      return cardsPlayed[skullKingIndex].playerId;
    }

    const firstPiratePlayedIndex = cardsPlayed.findIndex(
      ({ card }) =>
        isSpecialCard(card) &&
        (card.type === "pirate" ||
          (card.type === "tigress" && card.selection === "pirate"))
    );
    if (firstPiratePlayedIndex > -1) {
      return cardsPlayed[firstPiratePlayedIndex].playerId;
    }

    // TODO: DRY with below
    const blackCards = cardsPlayed.filter(
      ({ card }) => isColoredCard(card) && card.color === "black"
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
        { playerId: "", card: { number: 0, color: "black" } }
      );

      return winningCard.playerId;
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
        { playerId: "", card: { number: 0, color: trickColor } }
      );
      return winningCard.playerId;
    }

    if (
      cardsPlayed.every(
        ({ card }) =>
          isSpecialCard(card) &&
          (card.type === "escape" ||
            (card.type === "tigress" && card.selection === "escape"))
      )
    ) {
      return cardsPlayed[0].playerId;
    }

    throw Error("Programming error, unhandled win condition");
  }

  private updateScores() {
    this.scorecard?.scoreRound(this.currentRound);
  }

  private canPlayCard(hand: Card[], cardIndex: number) {
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
    // Player order for the round
    const order = this.playerOrder();
    // We can use cards played so far to determine whose turn it is
    const { cardsPlayed } = this.currentRound;
    // Number of cards played correlates to the index of the player whose turn it is from the order array
    const playerTurnIndex = cardsPlayed.length;
    // Get the index of the player which correlates to the actual players array in the game
    const playerTurnIdx = order[playerTurnIndex];
    // Get player from the players array using the lookup
    const player = Array.from(this.playerNames)[playerTurnIdx];

    return player === playerId;
  }

  private nextRound() {
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
    };

    this.shuffle();
    this.deal();
  }

  private shuffle() {
    this.deck.shuffle();
  }

  private deal() {
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

  private endGame() {}

  public __debugDump() {
    return {
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

