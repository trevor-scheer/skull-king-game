import { Deck } from "../deck";
import { buildDeck } from "../cards";
import cardSerializer from "../serializers/cardSerializer";

expect.addSnapshotSerializer(cardSerializer);

describe("deck", () => {
  it("has a complete, basic deck", () => {
    const deck = new Deck({});
    expect(deck.__debugDeck().originalDeck).toMatchInlineSnapshot(`
      [
        YELLOW 1,
        YELLOW 2,
        YELLOW 3,
        YELLOW 4,
        YELLOW 5,
        YELLOW 6,
        YELLOW 7,
        YELLOW 8,
        YELLOW 9,
        YELLOW 10,
        YELLOW 11,
        YELLOW 12,
        YELLOW 13,
        YELLOW 14,
        GREEN 1,
        GREEN 2,
        GREEN 3,
        GREEN 4,
        GREEN 5,
        GREEN 6,
        GREEN 7,
        GREEN 8,
        GREEN 9,
        GREEN 10,
        GREEN 11,
        GREEN 12,
        GREEN 13,
        GREEN 14,
        PURPLE 1,
        PURPLE 2,
        PURPLE 3,
        PURPLE 4,
        PURPLE 5,
        PURPLE 6,
        PURPLE 7,
        PURPLE 8,
        PURPLE 9,
        PURPLE 10,
        PURPLE 11,
        PURPLE 12,
        PURPLE 13,
        PURPLE 14,
        BLACK 1,
        BLACK 2,
        BLACK 3,
        BLACK 4,
        BLACK 5,
        BLACK 6,
        BLACK 7,
        BLACK 8,
        BLACK 9,
        BLACK 10,
        BLACK 11,
        BLACK 12,
        BLACK 13,
        BLACK 14,
        ESCAPE,
        ESCAPE,
        ESCAPE,
        ESCAPE,
        ESCAPE,
        PIRATE,
        PIRATE,
        PIRATE,
        PIRATE,
        PIRATE,
        TIGRESS,
        SKULLKING,
      ]
    `);
  });
  it("shuffles the deck", () => {
    const deck = new Deck({ shuffleSeed: 12345 });
    const { originalDeck, cardsInPlay } = deck.__debugDeck();
    // Verify shuffle occurred - cards should be in different order
    const originalIds = originalDeck.map((c) => c.id);
    const shuffledIds = cardsInPlay.map((c) => c.id);
    expect(shuffledIds).not.toEqual(originalIds);
    // Same cards should be present
    expect(shuffledIds.sort()).toEqual(originalIds.sort());
  });

  it("produces deterministic shuffle with same seed", () => {
    const deck1 = new Deck({ shuffleSeed: 42 });
    const deck2 = new Deck({ shuffleSeed: 42 });
    const shuffled1 = deck1.__debugDeck().cardsInPlay.map((c) => c.id);
    const shuffled2 = deck2.__debugDeck().cardsInPlay.map((c) => c.id);
    expect(shuffled1).toEqual(shuffled2);
  });

  it("produces different shuffle with different seeds", () => {
    const deck1 = new Deck({ shuffleSeed: 100 });
    const deck2 = new Deck({ shuffleSeed: 200 });
    const shuffled1 = deck1.__debugDeck().cardsInPlay.map((c) => c.id);
    const shuffled2 = deck2.__debugDeck().cardsInPlay.map((c) => c.id);
    expect(shuffled1).not.toEqual(shuffled2);
  });

  it("draws cards in order from top of deck", () => {
    const deck = new Deck({ shuffleSeed: 999 });
    const { cardsInPlay } = deck.__debugDeck();
    // Cards are drawn from the end of the array (top of deck)
    const expectedFirst = cardsInPlay[cardsInPlay.length - 1];
    const expectedSecond = cardsInPlay[cardsInPlay.length - 2];
    expect(deck.draw().id).toEqual(expectedFirst.id);
    expect(deck.draw().id).toEqual(expectedSecond.id);
  });
});

describe("deck configuration", () => {
  it("includes mermaids when configured", () => {
    const deck = buildDeck({ includeMermaids: true });
    const mermaids = deck.filter((c) => "type" in c && c.type === "mermaid");
    expect(mermaids).toHaveLength(2);
  });

  it("includes kraken when configured", () => {
    const deck = buildDeck({ includeKraken: true });
    const kraken = deck.filter((c) => "type" in c && c.type === "kraken");
    expect(kraken).toHaveLength(1);
  });

  it("includes white whale when configured", () => {
    const deck = buildDeck({ includeWhiteWhale: true });
    const whiteWhale = deck.filter((c) => "type" in c && c.type === "whiteWhale");
    expect(whiteWhale).toHaveLength(1);
  });

  it("includes loot cards when configured", () => {
    const deck = buildDeck({ includeLoot: true });
    const loot = deck.filter((c) => "type" in c && c.type === "loot");
    expect(loot).toHaveLength(2);
  });

  it("includes all expansion cards when configured", () => {
    const deck = buildDeck({
      includeMermaids: true,
      includeKraken: true,
      includeWhiteWhale: true,
      includeLoot: true,
    });
    // Base deck: 56 colored + 5 escapes + 5 pirates + tigress + skull king = 68
    // Expansion: 2 mermaids + 1 kraken + 1 white whale + 2 loot = 6
    expect(deck).toHaveLength(74);
  });

  it("creates deck via Deck class with config", () => {
    const deck = new Deck({
      deckConfig: { includeMermaids: true, includeKraken: true },
    });
    const originalDeck = deck.__debugDeck().originalDeck;
    expect(originalDeck).toHaveLength(71); // 68 + 2 mermaids + 1 kraken
  });
});
