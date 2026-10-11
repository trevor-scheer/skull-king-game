type ExplainedCard = {
  id: string;
  type?: string;
  selection?: string | null;
  color?: string;
  number?: number;
};
type ExplainedPlay = { playerId: string; card: ExplainedCard };
export function explainTrick(hand: {
  cardsPlayed: ExplainedPlay[];
  winningCard?: ExplainedPlay | null;
  trickDiscarded?: boolean | null;
  trickColor?: string | null;
  removedCardIds?: string[] | null;
}) {
  const plays = hand.cardsPlayed.filter(
    ({ card }) => !hand.removedCardIds?.includes(card.id),
  );
  const types = plays.map(({ card }) => card.type);
  const davy = types.includes("davyJones");
  const monster = davy
    ? undefined
    : [...types]
        .reverse()
        .find(
          (type) => type && ["kraken", "whiteWhale", "stingray"].includes(type),
        );
  const prefix = hand.removedCardIds?.length
    ? "Walk the Plank removed a Pirate. "
    : davy
      ? "Davy Jones removed all sea monsters. "
      : "";
  if (!hand.winningCard)
    return (
      prefix +
      (monster === "kraken"
        ? "Kraken discarded the trick; nobody wins it."
        : "No card can win this trick, so nobody takes it.")
    );
  const winner = hand.winningCard.card;
  if (monster === "whiteWhale")
    return (
      prefix +
      "White Whale makes the highest number win, regardless of suit. Ties go to the first played."
    );
  if (monster === "stingray" && winner.number != null)
    return (
      prefix +
      "Stingray makes the lowest number win, regardless of suit. Ties go to the first played."
    );
  if (winner.type === "mermaid")
    return (
      prefix +
      (types.includes("skullKing")
        ? "Mermaid captures Skull King, even with Pirates present."
        : types.includes("firstMate")
          ? "Mermaid outranks First Mate Con."
          : "Mermaid outranks numbered cards and Escapes.")
    );
  if (winner.type === "skullKing")
    return (
      prefix + "Skull King outranks Pirates, First Mate, and numbered cards."
    );
  if (winner.type === "firstMate")
    return prefix + "First Mate Con outranks every Pirate and numbered card.";
  if (
    winner.type === "pirate" ||
    winner.type === "maryThorne" ||
    winner.selection === "pirate"
  )
    return (
      prefix +
      "The first Pirate outranks the other Pirates, Mermaids, and numbered cards."
    );
  if (winner.number != null)
    return (
      prefix +
      (winner.color === "BLACK"
        ? "The highest black trump wins over the ordinary suits."
        : `The highest ${winner.color?.toLowerCase()} card in the lead suit wins. Equal ranks favor first played.`)
    );
  return prefix + "The first Escape wins when the other cards cannot beat it.";
}
