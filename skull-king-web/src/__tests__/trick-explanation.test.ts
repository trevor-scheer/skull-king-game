import { explainTrick } from "../utils/trickExplanation";
const play = (id: string, type?: string, number?: number, color?: string) => ({
  playerId: id,
  card: { id, type, number, color },
});
test("explains the Mermaid/Skull King/Pirate exception", () => {
  const mermaid = play("mermaid-1", "mermaid");
  expect(
    explainTrick({
      cardsPlayed: [
        play("pirate-1", "pirate"),
        play("skullKing", "skullKing"),
        mermaid,
      ],
      winningCard: mermaid,
    }),
  ).toContain("even with Pirates present");
});
test("explains the last monster, or Davy Jones removing all monsters", () => {
  const winner = play("yellow-1", undefined, 1, "YELLOW");
  const cardsPlayed = [
    play("whale", "whiteWhale"),
    play("ray", "stingray"),
    winner,
  ];
  expect(explainTrick({ cardsPlayed, winningCard: winner })).toContain(
    "lowest number",
  );
  expect(
    explainTrick({
      cardsPlayed: [...cardsPlayed, play("davy", "davyJones")],
      winningCard: winner,
    }),
  ).toContain("Davy Jones removed all sea monsters");
});
test("explains discarded tricks without falsely announcing a winner", () => {
  expect(
    explainTrick({
      cardsPlayed: [play("kraken", "kraken")],
      winningCard: null,
    }),
  ).toContain("nobody wins");
});
test("mentions removed Pirates in a Plank result", () => {
  const winner = play("green-2", undefined, 2, "GREEN");
  expect(
    explainTrick({
      cardsPlayed: [play("pirate-1", "pirate"), winner],
      winningCard: winner,
      removedCardIds: ["pirate-1"],
    }),
  ).toContain("Walk the Plank removed");
});
