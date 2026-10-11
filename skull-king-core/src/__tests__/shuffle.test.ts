import { Deck } from "../deck";
import { Game } from "../game";

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

it("keeps fractional seeds distinct", () => {
  expect(new Deck({ shuffleSeed: 0.3 }).getUndealtCards()).not.toEqual(new Deck({ shuffleSeed: 0.4 }).getUndealtCards());
});

it("continues the same shuffle stream after restoring a room", () => {
  const game = new Game("shuffle-save", { deck: new Deck({ shuffleSeed: 42 }) });
  const restored = Game.restoreCheckpoint(game.checkpoint());
  game.__debugDump().deck.shuffle();
  restored.__debugDump().deck.shuffle();
  expect(restored.__debugDump().deck.getUndealtCards()).toEqual(game.__debugDump().deck.getUndealtCards());
});
