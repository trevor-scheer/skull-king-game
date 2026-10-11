import { Deck } from "../deck";

it("accepts integer seeds without losing or inventing cards", () => {
  const deck = new Deck({ shuffleSeed: 2 });
  const { originalDeck, cardsInPlay } = deck.__debugDeck();
  expect(cardsInPlay).toHaveLength(originalDeck.length);
  expect(cardsInPlay.map(card => card.id).sort()).toEqual(originalDeck.map(card => card.id).sort());
});

it("advances a repeatable shuffle stream between rounds", () => {
  const first = new Deck({ shuffleSeed: 0.3 });
  const second = new Deck({ shuffleSeed: 0.3 });
  const initial = first.getUndealtCards();
  expect(initial).toEqual(second.getUndealtCards());
  first.shuffle();
  second.shuffle();
  expect(first.getUndealtCards()).not.toEqual(initial);
  expect(first.getUndealtCards()).toEqual(second.getUndealtCards());
});
