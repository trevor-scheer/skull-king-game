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
  it("shuffles", () => {
    const deck = new Deck({ shuffleSeed: 0.4 });
    expect(deck.__debugDeck().cardsInPlay).toMatchInlineSnapshot(`
      [
        BLACK 14,
        BLACK 13,
        BLACK 2,
        YELLOW 1,
        PURPLE 3,
        PURPLE 8,
        BLACK 1,
        BLACK 7,
        YELLOW 2,
        ESCAPE,
        GREEN 14,
        PURPLE 2,
        PURPLE 6,
        PURPLE 7,
        PURPLE 11,
        PURPLE 13,
        YELLOW 3,
        BLACK 4,
        BLACK 6,
        BLACK 9,
        BLACK 12,
        YELLOW 4,
        ESCAPE,
        ESCAPE,
        PIRATE,
        PIRATE,
        SKULLKING,
        YELLOW 12,
        YELLOW 5,
        PURPLE 4,
        YELLOW 13,
        PURPLE 5,
        YELLOW 14,
        YELLOW 6,
        PURPLE 9,
        GREEN 1,
        PURPLE 10,
        GREEN 2,
        PURPLE 12,
        PURPLE 14,
        GREEN 3,
        YELLOW 7,
        GREEN 4,
        BLACK 3,
        BLACK 5,
        GREEN 5,
        YELLOW 8,
        GREEN 6,
        BLACK 8,
        BLACK 10,
        GREEN 7,
        BLACK 11,
        GREEN 8,
        YELLOW 9,
        ESCAPE,
        GREEN 9,
        ESCAPE,
        GREEN 10,
        YELLOW 10,
        PIRATE,
        GREEN 11,
        PIRATE,
        GREEN 12,
        PIRATE,
        TIGRESS,
        GREEN 13,
        YELLOW 11,
        PURPLE 1,
      ]
    `);
  });
  it("shuffles", () => {
    const deck = new Deck({ shuffleSeed: 0.3 });
    expect(deck.__debugDeck().cardsInPlay).toMatchInlineSnapshot(`
      [
        PURPLE 3,
        PIRATE,
        PURPLE 2,
        BLACK 3,
        BLACK 13,
        PIRATE,
        GREEN 11,
        GREEN 14,
        YELLOW 1,
        PURPLE 7,
        PURPLE 10,
        PURPLE 13,
        BLACK 2,
        BLACK 6,
        BLACK 9,
        BLACK 12,
        ESCAPE,
        ESCAPE,
        YELLOW 2,
        SKULLKING,
        GREEN 9,
        YELLOW 7,
        GREEN 10,
        GREEN 12,
        YELLOW 8,
        GREEN 13,
        PURPLE 1,
        YELLOW 9,
        YELLOW 3,
        PURPLE 4,
        PURPLE 5,
        YELLOW 10,
        PURPLE 6,
        PURPLE 8,
        YELLOW 11,
        PURPLE 9,
        PURPLE 11,
        YELLOW 12,
        PURPLE 12,
        PURPLE 14,
        BLACK 1,
        YELLOW 13,
        YELLOW 4,
        BLACK 4,
        YELLOW 14,
        BLACK 5,
        BLACK 7,
        GREEN 1,
        BLACK 8,
        BLACK 10,
        BLACK 11,
        GREEN 2,
        YELLOW 5,
        BLACK 14,
        GREEN 3,
        ESCAPE,
        ESCAPE,
        GREEN 4,
        ESCAPE,
        PIRATE,
        PIRATE,
        GREEN 5,
        YELLOW 6,
        PIRATE,
        GREEN 6,
        TIGRESS,
        GREEN 7,
        GREEN 8,
      ]
    `);
  });
  it("draws cards in order", () => {
    const deck = new Deck({ shuffleSeed: 0.3 });
    expect(deck.draw()).toMatchInlineSnapshot(`GREEN 8`);
    expect(deck.draw()).toMatchInlineSnapshot(`GREEN 7`);
    expect(deck.draw()).toMatchInlineSnapshot(`TIGRESS`);
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
