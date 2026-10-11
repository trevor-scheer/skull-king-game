import { buildDeck, Card, isColoredCard } from "../cards";
import { Deck } from "../deck";
import { Game, Hand } from "../game";
import { determineTrickWinner } from "../trickRules";
import { scoreRoundBonuses } from "../bonusPoints";
import { calculateRoundPoints } from "../scoring";

const config = {
  includeExpansion: true,
  includeFirstMate: true,
  includeStingray: true,
  includeDavyJones: true,
  includeWalkThePlank: true,
  includeLastVolley: true,
  includeKraken: true,
  includeWhiteWhale: true,
  includeLoot: true,
};
const deck = buildDeck(config);
const card = (id: string): Card => ({
  ...deck.find((candidate) => candidate.id === id)!,
});
const played = (ids: string[]) =>
  ids.map((id, index) => ({
    id: String(index),
    playerId: String(index),
    card: card(id),
  }));
const resolve = (ids: string[], removed: string[] = []) =>
  determineTrickWinner(played(ids), "YELLOW", removed);
function table(hands: string[][], abilities = false) {
  const game = new Game("expansion", {
    deck: new Deck({ deckConfig: config }),
    pirateAbilities: abilities,
  });
  const tokens = hands.map((_, index) => game.addPlayer(String(index)));
  game.start();
  const dump = game.__debugDump();
  const round = dump.currentRound!;
  round.roundNumber = hands[0].length;
  round.phase = "play";
  round.leader = 0;
  hands.forEach((ids, index) => {
    dump.players[index].hand = ids.map(card);
    round.bids.set(String(index), 0);
  });
  const play = (index: number, id: string, choices = {}) =>
    game.playCard({ playerToken: tokens[index], cardId: id, ...choices });
  return { game, round, tokens, play, players: dump.players };
}

test("all expansion cards have unique IDs and all options produce 93 cards", () => {
  expect(deck).toHaveLength(93);
  expect(new Set(deck.map(({ id }) => id)).size).toBe(93);
  expect(buildDeck({ includeExpansion: true })).toHaveLength(84);
});

test.each([
  [["yellow-7", "yellow-expansion-7"], "yellow-7"],
  [["yellow-expansion-8", "yellow-8"], "yellow-expansion-8"],
  [["pirate-1", "firstMate"], "firstMate"],
  [["firstMate", "skullKing"], "skullKing"],
  [["pirate-1", "firstMate", "mermaid-1"], "mermaid-1"],
  [["mermaid-1", "firstMate", "pirate-1"], "mermaid-1"],
  [["maryThorne", "mermaid-1"], "maryThorne"],
  [["stingray", "black-1", "yellow-3"], "black-1"],
  [["whiteWhale", "stingray", "yellow-1", "black-14"], "yellow-1"],
  [["stingray", "whiteWhale", "yellow-1", "black-14"], "black-14"],
  [["kraken", "stingray", "yellow-1"], "yellow-1"],
  [["wild-15", "whiteWhale", "black-14"], "wild-15"],
  [["davyJones", "stingray", "pirate-1"], "pirate-1"],
  [["kraken", "whiteWhale", "davyJones", "yellow-1"], "yellow-1"],
  [["lastVolley", "escape-1", "walkThePlank", "escape-2"], "escape-1"],
  [["stingray", "escape-1", "escape-2"], "escape-1"],
] as [string[], string][])("resolves %j to %s", (ids, winner) => {
  const result = resolve(ids);
  expect(result.trickDiscarded).toBe(false);
  expect(result.winner.card.id).toBe(winner);
});

test.each([
  ["lastVolley", "walkThePlank"],
  ["davyJones", "stingray", "walkThePlank"],
  ["stingray", "kraken", "yellow-1"],
])("discards tricks without a winner: %j", (...ids) => {
  expect(resolve(ids).trickDiscarded).toBe(true);
});

test("Walk the Plank removes a Pirate before winner selection", () => {
  expect(
    resolve(["pirate-1", "mermaid-1", "walkThePlank"], ["pirate-1"]).winner.card
      .id,
  ).toBe("mermaid-1");
});

test("0/14 declarations validate atomically and do not change deck card", () => {
  const t = table([
    ["yellow-zero-fourteen", "yellow-2"],
    ["yellow-1", "escape-1"],
    ["yellow-3", "escape-2"],
  ]);
  expect(() => t.play(0, "yellow-zero-fourteen")).toThrow("Choose 0 or 14");
  expect(t.players[0].hand).toHaveLength(2);
  t.play(0, "yellow-zero-fourteen", { numberChoice: 14 });
  expect(t.round.cardsPlayed[0].card).toMatchObject({ number: 14 });
  expect(
    t.game.__debugDump().deck.getCard("yellow-zero-fourteen"),
  ).toMatchObject({ number: 0 });
});

test("Wild 15 declares a nonblack suit and must follow an existing nonblack lead", () => {
  const t = table([
    ["yellow-1", "escape-1"],
    ["wild-15", "purple-4"],
    ["yellow-3", "escape-2"],
  ]);
  t.play(0, "yellow-1");
  expect(() => t.play(1, "purple-4")).toThrow("Illegal move");
  expect(() => t.play(1, "wild-15", { colorChoice: "PURPLE" })).toThrow(
    "follow the lead",
  );
  t.play(1, "wild-15");
  expect(t.round.cardsPlayed[1].card).toMatchObject({
    color: "YELLOW",
    number: 15,
  });
});

test("Wild 15 cannot evade a black suit held in hand", () => {
  const t = table([
    ["black-1", "escape-1"],
    ["wild-15", "black-2"],
    ["yellow-3", "escape-2"],
  ]);
  t.play(0, "black-1");
  expect(() => t.play(1, "wild-15")).toThrow("Illegal move");
});

test("Walk the Plank pauses for an authenticated mandatory choice and rejects stale retries", () => {
  const t = table([
    ["pirate-1", "yellow-2"],
    ["pirate-2", "yellow-1"],
    ["walkThePlank", "yellow-3"],
  ]);
  t.play(0, "pirate-1");
  t.play(1, "pirate-2");
  t.play(2, "walkThePlank");
  const id = t.round.plankChoice!.id;
  expect(t.round.hands).toHaveLength(0);
  expect(t.game.getStateForPlayer().currentRound!.playerTurn).toBeNull();
  expect(() => t.game.choosePlankTarget(t.tokens[0], id, "pirate-1")).toThrow(
    "Only the player",
  );
  expect(() => t.game.choosePlankTarget(t.tokens[2], id, "yellow-2")).toThrow(
    "Choose a Pirate",
  );
  expect(t.game.choosePlankTarget(t.tokens[2], id, "pirate-1")).toBe(true);
  expect(t.round.lastCompletedHand!.winningCard!.card.id).toBe("pirate-2");
  expect(t.game.choosePlankTarget(t.tokens[2], id, "pirate-2")).toBe(false);
});

test("Last Volley adds a turn after all normal turns then skips that player in the final trick", () => {
  const t = table([
    ["lastVolley", "yellow-14"],
    ["yellow-1", "yellow-2"],
    ["yellow-3", "yellow-4"],
  ]);
  t.play(0, "lastVolley");
  t.play(1, "yellow-1");
  t.play(2, "yellow-3");
  expect(t.round.phase).toBe("play");
  expect(t.game.getStateForPlayer().currentRound!.playerTurn).toBe("0");
  t.play(0, "yellow-14");
  expect(t.round.lastCompletedHand!.winningCard!.playerId).toBe("0");
  t.game.advanceFromTrickResult();
  expect(t.game.getStateForPlayer().currentRound!.playerTurn).toBe("1");
  t.play(1, "yellow-2");
  t.play(2, "yellow-4");
  expect(t.round.phase).toBe("trick_result");
  expect(t.round.hands).toHaveLength(2);
});

test("Last Volley on final trick never requests an extra card", () => {
  const t = table([["lastVolley"], ["escape-1"], ["escape-2"]]);
  t.play(0, "lastVolley");
  t.play(1, "escape-1");
  t.play(2, "escape-2");
  expect(t.round.phase).toBe("trick_result");
  expect(t.round.lastCompletedHand!.winningCard!.playerId).toBe("1");
});

test("Mary selects an unseen random card privately and forces it against the lead suit", () => {
  const random = jest.spyOn(Math, "random").mockReturnValue(0);
  const t = table(
    [
      ["maryThorne", "yellow-1", "yellow-2"],
      ["escape-1", "purple-1", "yellow-3"],
      ["escape-2", "yellow-4", "yellow-5"],
    ],
    true,
  );
  t.play(0, "maryThorne");
  t.play(1, "escape-1");
  t.play(2, "escape-2");
  t.game.usePirateAbility(t.tokens[0], t.round.pirateAbility!.id, {
    action: "forceCard",
    playerId: "1",
  });
  expect(
    t.game.getStateForPlayer(t.tokens[0]).currentRound!.myForcedCardId,
  ).toBeNull();
  expect(
    t.game.getStateForPlayer(t.tokens[1]).currentRound!.myForcedCardId,
  ).toBe("purple-1");
  t.game.advanceFromTrickResult();
  t.play(0, "yellow-1");
  expect(() => t.play(1, "yellow-3")).toThrow("Illegal move");
  t.play(1, "purple-1");
  expect(t.round.forcedCards!.has("1")).toBe(false);
  random.mockRestore();
});

test("First Mate offers every captured Pirate's ability in order, with individually stale IDs", () => {
  const t = table(
    [
      ["firstMate", "yellow-1"],
      ["pirate-1", "yellow-2"],
      ["pirate-5", "yellow-3"],
    ],
    true,
  );
  t.play(0, "firstMate");
  t.play(1, "pirate-1");
  t.play(2, "pirate-5");
  const first = t.round.pirateAbility!.id;
  expect(t.round.pirateAbility!.kind).toBe("rosie");
  t.game.usePirateAbility(t.tokens[0], first, { action: "decline" });
  expect(t.round.pirateAbility!.kind).toBe("harry");
  expect(
    t.game.usePirateAbility(t.tokens[0], first, { action: "decline" }),
  ).toBe(false);
  t.game.usePirateAbility(t.tokens[0], t.round.pirateAbility!.id, {
    action: "adjustBid",
    amount: 1,
  });
  expect(t.round.pirateAbility).toBeNull();
  expect(t.round.bids.get("0")).toBe(1);
});

function bonuses(
  ids: string[],
  winnerIndex: number,
  name = String(winnerIndex),
  removed: string[] = [],
) {
  const cardsPlayed = played(ids);
  const hand: Hand = {
    id: "hand",
    trickColor: "YELLOW",
    cardsPlayed,
    winningCard: cardsPlayed[winnerIndex],
    removedCardIds: removed,
  };
  return scoreRoundBonuses(
    {
      hands: [hand],
      bids: new Map([[name, 1]]),
      tricksWon: new Map([
        [String(winnerIndex), [cardsPlayed.map(({ card }) => card)]],
      ]),
    },
    name,
  );
}

test("expansion 7/8 and First Mate bonuses require exact bids even under Rascal", () => {
  const result = bonuses(
    ["skullKing", "firstMate", "yellow-expansion-7", "black-expansion-8"],
    0,
  );
  expect(result.expansionBonus).toBe(30);
  expect(result.captureBonus).toBe(0);
  for (const scoringMode of ["classic", "rascal"] as const) {
    expect(
      calculateRoundPoints({
        scoringMode,
        roundNumber: 3,
        tricksBid: 2,
        tricksWon: 1,
        exactBonus: result.expansionBonus,
      }).bonusPoints,
    ).toBe(0);
    expect(
      calculateRoundPoints({
        scoringMode,
        roundNumber: 3,
        tricksBid: 1,
        tricksWon: 1,
        exactBonus: result.expansionBonus,
      }).bonusPoints,
    ).toBe(30);
  }
});

test("0/14 has no capture bonus and removed Pirates grant none", () => {
  expect(
    bonuses(["skullKing", "pirate-1", "black-zero-fourteen"], 0, "0", [
      "pirate-1",
    ]).captureBonus,
  ).toBe(0);
});

test("Davy Jones awards its player 20 per monster even if another player wins", () => {
  expect(
    bonuses(["davyJones", "kraken", "stingray", "yellow-1"], 3, "0")
      .expansionBonus,
  ).toBe(40);
  expect(
    bonuses(["davyJones", "kraken", "stingray", "yellow-1"], 3).expansionBonus,
  ).toBe(0);
});

test("removing the leading Pirate lets the remaining numbered cards establish the winning suit", () => {
  const cards = played(["pirate-1", "green-2", "yellow-14", "walkThePlank"]);
  const result = determineTrickWinner(cards, null, ["pirate-1"]);
  expect(result.trickDiscarded).toBe(false);
  expect(result.winner.card.id).toBe("green-2");
});
