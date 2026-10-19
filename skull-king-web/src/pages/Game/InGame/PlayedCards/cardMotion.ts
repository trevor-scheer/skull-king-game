type CardOrigin = { left: number; top: number; width: number; height: number };
const origins = new Map<
  string,
  { rect: CardOrigin; at: number; scrollX: number; scrollY: number }
>();

export function rememberCardOrigin(cardId: string) {
  const card = [
    ...document.querySelectorAll<HTMLElement>(
      ".Hand-playerHand [data-card-id]",
    ),
  ].find((element) => element.dataset.cardId === cardId);
  if (!card) return;
  origins.clear();
  origins.set(cardId, {
    rect: (card.querySelector(".Card-surface") ?? card).getBoundingClientRect(),
    at: Date.now(),
    scrollX: window.scrollX,
    scrollY: window.scrollY,
  });
}

export function takeCardOrigin(cardId: string): CardOrigin | undefined {
  const origin = origins.get(cardId);
  origins.delete(cardId);
  return origin && Date.now() - origin.at < 10_000
    ? {
        left: origin.rect.left + origin.scrollX - window.scrollX,
        top: origin.rect.top + origin.scrollY - window.scrollY,
        width: origin.rect.width,
        height: origin.rect.height,
      }
    : undefined;
}

export type TableMoment = {
  roundId: number;
  phase: string;
  resultId?: string;
  cardIds: string[];
};

export function cardMotionChanges(
  previous: TableMoment | undefined,
  next: TableMoment,
) {
  const collecting = Boolean(
    previous?.phase === "trick_result" &&
    (next.phase !== "trick_result" ||
      previous.resultId !== next.resultId ||
      previous.roundId !== next.roundId),
  );
  const priorCards =
    previous && previous.roundId === next.roundId && !collecting
      ? new Set(previous.cardIds)
      : new Set<string>();
  return {
    collecting,
    entering: previous ? next.cardIds.filter((id) => !priorCards.has(id)) : [],
  };
}
