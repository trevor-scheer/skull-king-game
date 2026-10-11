import { Card } from "../src/cards";
import { Deck } from "../src/deck";
import { Game } from "../src/game";

export function pirateGame(pirateId: string, enabled = true, finalTrick = false, opponentCard?: Card) {
  const pirate: Card = { id: pirateId, type: "pirate" };
  const escapes: Card[] = Array.from({ length: 5 }, (_, index) => ({ id: `escape-${index + 1}`, type: "escape" }));
  const numbered: Card[] = Array.from({ length: 12 }, (_, index) => ({ id: `yellow-${index + 1}`, color: "YELLOW", number: index + 1 }));
  const order = finalTrick
    ? [pirate, escapes[0], ...numbered]
    : [escapes[0], escapes[1], opponentCard ?? escapes[2], pirate, escapes[3], numbered[0], ...numbered.slice(1)];
  const deck = new Deck({ customDeck: order });
  jest.spyOn(deck, "shuffle").mockImplementation(() => {});
  deck.__debugDeck().cardsInPlay.splice(0, order.length, ...order.slice().reverse());
  const game = new Game("pirates", { deck, pirateAbilities: enabled });
  const alice = game.addPlayer("Alice");
  const bob = game.addPlayer("Bob");
  game.start();
  game.submitBid({ playerToken: alice, count: 0 });
  game.submitBid({ playerToken: bob, count: 1 });
  game.playCard({ playerToken: bob, cardId: finalTrick ? "escape-1" : "escape-2" });
  game.playCard({ playerToken: alice, cardId: finalTrick ? pirateId : "escape-1" });
  if (!finalTrick) {
    game.advanceFromTrickResult();
    game.submitBid({ playerToken: alice, count: 1 });
    game.submitBid({ playerToken: bob, count: 0 });
    game.playCard({ playerToken: alice, cardId: pirateId });
    game.playCard({ playerToken: bob, cardId: opponentCard?.id ?? "escape-3" });
  }
  return { game, deck, alice, bob };
}
