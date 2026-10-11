import { Card, Color, SpecialCardTypes } from "../cards";
import { Deck } from "../deck";
import { Game, Hand } from "../game";
import { Scorecard } from "../scorecard";

const special = (
  type: SpecialCardTypes,
  id: string = type,
  selection?: "pirate" | "escape",
): Card => ({ id, type, ...(selection ? { selection } : {}) });
const number = (color: Color, value: number): Card => ({
  id: `${color}-${value}`,
  color,
  number: value,
});

function trickGame(cards: Card[], extras: Card[][] = []) {
  const game = new Game("optional", {
    deck: new Deck({ customDeck: [...cards, ...extras.flat()] }),
  });
  const tokens = cards.map((_, index) => game.addPlayer(`P${index}`));
  game.start();
  const state = game.__debugDump();
  state.currentRound!.leader = 0;
  state.players.forEach((player, index) => {
    player.hand = [cards[index], ...(extras[index] ?? [])];
  });
  tokens.forEach((playerToken) => game.submitBid({ playerToken, count: 1 }));
  const play = (index: number) =>
    game.playCard({
      playerToken: tokens[index],
      cardId: cards[index].id,
      selection:
        "selection" in cards[index] ? cards[index].selection : undefined,
    });
  return { game, play, tokens };
}

function finishTrick(cards: Card[]) {
  const { game, play } = trickGame(cards);
  cards.forEach((_, index) => play(index));
  return game.getStateForPlayer().currentRound!;
}

function hand(cards: Card[], winner: number | null, discarded = false): Hand {
  const cardsPlayed = cards.map((card, index) => ({
    id: `${index}-${card.id}`,
    playerId: `P${index}`,
    card,
  }));
  return {
    id: cards.map((card) => card.id).join("/"),
    trickColor: "GREEN",
    cardsPlayed,
    winningCard: winner === null ? null : cardsPlayed[winner],
    trickDiscarded: discarded,
  };
}

function score(hands: Hand[], bids: number[]) {
  const names = bids.map((_, index) => `P${index}`);
  const tricksWon = new Map<string, Card[][]>();
  for (const trick of hands) {
    if (trick.trickDiscarded || !trick.winningCard) continue;
    const name = trick.winningCard.playerId;
    tricksWon.set(name, [
      ...(tricksWon.get(name) ?? []),
      trick.cardsPlayed.map((play) => play.card),
    ]);
  }
  const round = {
    roundNumber: hands.length,
    tricksWon,
    bids: new Map(names.map((name, index) => [name, bids[index]])),
    hands,
  };
  const scorecard = new Scorecard(new Set(names));
  scorecard.scoreRound(round);
  return scorecard.getScoreCard()[0];
}

describe("optional-card trick rules", () => {
  it("playing a shared Tigress in another game cannot rewrite a completed capture", () => {
    const sharedTigress = special("tigress", "tigress", "pirate");
    const first = trickGame([sharedTigress, special("mermaid")]);
    first.play(0);
    first.play(1);
    const completedHand =
      first.game.getStateForPlayer().currentRound!.lastCompletedHand!;
    const second = trickGame([sharedTigress, special("escape")]);
    second.game.playCard({
      playerToken: second.tokens[0],
      cardId: "tigress",
      selection: "escape",
    });
    expect(completedHand.winningCard!.card).toMatchObject({
      selection: "pirate",
    });
    expect(sharedTigress).toMatchObject({ selection: "pirate" });
    expect(score([completedHand], [1, 0])[0].bonusPoints).toBe(20);
  });

  it("Kraken after White Whale chooses the leader as if neither creature was played", () => {
    const result = finishTrick([
      special("whiteWhale"),
      special("escape"),
      special("kraken"),
    ]);
    expect(result.lastCompletedHand!.trickDiscarded).toBe(true);
    expect(result.leader).toBe("P1");
  });

  it("lets the first escape win ahead of later Loot", () => {
    const result = finishTrick([special("escape"), special("loot")]);
    expect(result.lastCompletedHand!.winningCard!.playerId).toBe("P0");
  });

  it.each(["pirate", "mermaid", "skullKing", "kraken", "whiteWhale"] as const)(
    "%s lead leaves all later numbered suits unrestricted",
    (type) => {
      const cards = [special(type), number("GREEN", 5), number("YELLOW", 9)];
      const { game, play } = trickGame(cards, [[], [], [number("GREEN", 10)]]);
      play(0);
      play(1);
      expect(game.getStateForPlayer().currentRound!.trickColor).toBeNull();
      expect(() => play(2)).not.toThrow();
    },
  );

  it("an escape followed by a character still leaves no required suit", () => {
    const cards = [
      special("escape"),
      special("pirate"),
      number("GREEN", 5),
      number("YELLOW", 9),
    ];
    const { game, play } = trickGame(cards, [
      [],
      [],
      [],
      [number("GREEN", 10)],
    ]);
    play(0);
    play(1);
    play(2);
    expect(game.getStateForPlayer().currentRound!.trickColor).toBeNull();
    expect(() => play(3)).not.toThrow();
  });

  it.each([
    special("escape"),
    special("loot"),
    special("tigress", "tigress", "escape"),
  ])(
    "escape-like lead %j lets the next number establish the suit",
    (leadingCard) => {
      const cards = [leadingCard, number("GREEN", 5), number("YELLOW", 9)];
      const { game, play } = trickGame(cards, [[], [], [number("GREEN", 10)]]);
      play(0);
      play(1);
      expect(game.getStateForPlayer().currentRound!.trickColor).toBe("GREEN");
      expect(() => play(2)).toThrow("Illegal move");
    },
  );

  it("White Whale played later preserves the established suit requirement", () => {
    const cards = [
      number("GREEN", 5),
      special("whiteWhale"),
      number("YELLOW", 9),
    ];
    const { game, play } = trickGame(cards, [[], [], [number("GREEN", 10)]]);
    play(0);
    play(1);
    expect(() => play(2)).toThrow("Illegal move");
  });

  it("White Whale discarding only specials gives the normal winner the next lead", () => {
    const result = finishTrick([special("pirate"), special("whiteWhale")]);
    expect(result.lastCompletedHand!.winningCard).toBeNull();
    expect(result.lastCompletedHand!.trickDiscarded).toBe(true);
    expect(result.leader).toBe("P0");
  });

  it("Kraken after White Whale handles all-escape fallback without crashing", () => {
    const result = finishTrick([
      special("escape"),
      special("whiteWhale"),
      special("kraken"),
    ]);
    expect(result.lastCompletedHand!.trickDiscarded).toBe(true);
    expect(result.leader).toBe("P0");
  });

  it("Kraken after White Whale uses normal trump to select the next leader", () => {
    const result = finishTrick([
      number("YELLOW", 12),
      number("BLACK", 3),
      special("whiteWhale"),
      special("kraken"),
    ]);
    expect(result.lastCompletedHand!.trickDiscarded).toBe(true);
    expect(result.leader).toBe("P1");
  });

  it("White Whale after Kraken awards the highest number, with first-played ties", () => {
    const result = finishTrick([
      number("YELLOW", 14),
      special("kraken"),
      number("BLACK", 14),
      special("whiteWhale"),
    ]);
    expect(result.lastCompletedHand!.trickDiscarded).toBe(false);
    expect(result.lastCompletedHand!.winningCard!.playerId).toBe("P0");
  });

  it("Mermaid beats Skull King and pirate together", () => {
    const result = finishTrick([
      special("pirate"),
      special("skullKing"),
      special("mermaid"),
    ]);
    expect(result.lastCompletedHand!.winningCard!.playerId).toBe("P2");
  });
});

describe("optional-card bonuses", () => {
  it("awards Mermaid capture of Skull King, not bonuses for the defeated King", () => {
    const result = score(
      [
        hand(
          [
            special("mermaid"),
            special("skullKing"),
            special("pirate"),
            number("YELLOW", 14),
          ],
          0,
        ),
      ],
      [1, 0, 0, 0],
    );
    expect(result[0].bonusPoints).toBe(50);
  });

  it.each([special("pirate"), special("tigress", "tigress", "pirate")])(
    "awards 20 per Mermaid captured by pirate-like winner %j",
    (winner) => {
      const result = score(
        [
          hand(
            [
              winner,
              special("mermaid", "mermaid-1"),
              special("mermaid", "mermaid-2"),
            ],
            0,
          ),
        ],
        [1, 0, 0],
      );
      expect(result[0].bonusPoints).toBe(40);
    },
  );

  it("White Whale retains numbered bonuses but destroys character and Loot bonuses", () => {
    const result = score(
      [
        hand(
          [
            number("BLACK", 14),
            special("whiteWhale"),
            special("skullKing"),
            special("pirate"),
            special("loot"),
          ],
          0,
        ),
      ],
      [1, 0, 0, 0, 0],
    );
    expect(result[0].bonusPoints).toBe(20);
    expect(result[4].bonusPoints).toBe(0);
  });

  it("awards Loot to both exact partners, including a correct zero bidder", () => {
    const result = score(
      [hand([number("GREEN", 5), special("loot")], 0)],
      [1, 0],
    );
    expect(result.map((block) => block.bonusPoints)).toEqual([20, 20]);
    expect(result.map((block) => block.totalPoints)).toEqual([40, 30]);
  });

  it.each([
    [0, 0],
    [1, 1],
  ])("withholds Loot when either partner misses %j", (first, second) => {
    const result = score(
      [hand([number("GREEN", 5), special("loot")], 0)],
      [first, second],
    );
    expect(result.map((block) => block.bonusPoints)).toEqual([0, 0]);
  });

  it("each captured Loot creates its own alliance", () => {
    const result = score(
      [
        hand(
          [
            number("GREEN", 5),
            special("loot", "loot-1"),
            special("loot", "loot-2"),
          ],
          0,
        ),
      ],
      [1, 0, 0],
    );
    expect(result.map((block) => block.bonusPoints)).toEqual([40, 20, 20]);
  });

  it("does not create a self-alliance when leading Loot wins", () => {
    const result = score(
      [hand([special("loot"), special("escape")], 0)],
      [1, 0],
    );
    expect(result.map((block) => block.bonusPoints)).toEqual([0, 0]);
  });

  it("does not award Loot or captures from a discarded trick", () => {
    const result = score(
      [
        hand(
          [special("kraken"), special("loot"), number("BLACK", 14)],
          null,
          true,
        ),
      ],
      [0, 0, 0],
    );
    expect(result.map((block) => block.bonusPoints)).toEqual([0, 0, 0]);
  });
});
