/** @jest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import { PlayedCards } from "../pages/Game/InGame/PlayedCards/PlayedCards";
import {
  cardMotionChanges,
  TableMoment,
} from "../pages/Game/InGame/PlayedCards/cardMotion";

const mockQuery = jest.fn();
jest.mock("../hooks/PlayerTokenContext", () => ({
  usePlayerToken: () => ["token"],
}));
jest.mock("../hooks/useGameId", () => ({ useGameId: () => "room" }));
jest.mock("../types/graphqlTypes", () => ({
  useCardsPlayedQuery: () => mockQuery(),
}));
jest.mock("../pages/Game/InGame/TrickResult/TrickResult", () => ({
  TrickResult: () => <p>Winner announced</p>,
}));
const card = (player: string, id: string) => ({
  id: `${player}-${id}`,
  playerId: player,
  card: { __typename: "ColoredCard", id, color: "GREEN", number: 3 },
});
function state(
  phase: string,
  cards: ReturnType<typeof card>[],
  result?: unknown,
) {
  return {
    data: {
      state: {
        me: { name: "Ada" },
        currentRound: {
          id: 1,
          phase,
          cardsPlayed: cards,
          lastCompletedHand: result,
        },
      },
    },
  };
}

it("keeps played card nodes when the last card lands and the winner is announced", () => {
  const first = card("Ada", "g3");
  const last = card("Grace", "g4");
  mockQuery.mockReturnValue(state("play", [first]));
  const { container, rerender } = render(<PlayedCards />);
  const firstNode = container.querySelector('[data-play-id="Ada-g3"]');
  mockQuery.mockReturnValue(
    state("trick_result", [], {
      id: "hand1",
      cardsPlayed: [first, last],
      winningCard: last,
    }),
  );
  rerender(<PlayedCards />);
  expect(container.querySelector('[data-play-id="Ada-g3"]')).toBe(firstNode);
  expect(screen.getByLabelText("Cards on the table").children).toHaveLength(2);
  expect(screen.getByText("Winner announced")).toBeTruthy();
  mockQuery.mockReturnValue(state("play", []));
  rerender(<PlayedCards />);
  expect(screen.getByLabelText("Cards on the table").children).toHaveLength(0);
});

it("only animates newly observed cards and collects a completed trick once", () => {
  const playing: TableMoment = {
    roundId: 1,
    phase: "play",
    cardIds: ["Ada-g3"],
  };
  expect(cardMotionChanges(undefined, playing).entering).toEqual([]);
  const result = {
    ...playing,
    phase: "trick_result",
    resultId: "hand1",
    cardIds: ["Ada-g3", "Grace-g4"],
  };
  expect(cardMotionChanges(playing, result)).toEqual({
    collecting: false,
    entering: ["Grace-g4"],
  });
  expect(cardMotionChanges(result, result)).toEqual({
    collecting: false,
    entering: [],
  });
  const next = { roundId: 2, phase: "bid", cardIds: [] };
  expect(cardMotionChanges(result, next)).toEqual({
    collecting: true,
    entering: [],
  });
  expect(cardMotionChanges(next, next)).toEqual({
    collecting: false,
    entering: [],
  });
});

it("does not restart a card flight on an unrelated query refresh", () => {
  const original = Element.prototype.animate;
  const animations: { finish: jest.Mock; cancel: jest.Mock }[] = [];
  const animate = jest.fn(() => {
    const animation = {
      finish: jest.fn(),
      cancel: jest.fn(),
      finished: new Promise(() => {}),
    };
    animations.push(animation);
    return animation;
  });
  Element.prototype.animate = animate as unknown as typeof original;
  mockQuery.mockReturnValue(state("play", []));
  const { rerender, unmount } = render(<PlayedCards />);
  const first = card("Ada", "g3");
  mockQuery.mockReturnValue(state("play", [first]));
  rerender(<PlayedCards />);
  expect(
    animate.mock.contexts.filter((node) => node.dataset.playId),
  ).toHaveLength(1);
  mockQuery.mockReturnValue(state("play", [{ ...first }]));
  rerender(<PlayedCards />);
  expect(
    animate.mock.contexts.filter((node) => node.dataset.playId),
  ).toHaveLength(1);
  expect(animations[0].finish).not.toHaveBeenCalled();
  mockQuery.mockReturnValue(state("play", [first, card("Grace", "g4")]));
  rerender(<PlayedCards />);
  expect(animations[0].cancel).toHaveBeenCalledTimes(1);
  expect(
    animate.mock.contexts.filter((node) => node.dataset.playId),
  ).toHaveLength(2);
  const backFlipIndex = animate.mock.contexts.findIndex((node) =>
    node.classList.contains("PlayedCards-flightBack"),
  );
  expect(backFlipIndex).toBeGreaterThan(-1);
  expect(
    (animate.mock.calls[backFlipIndex] as unknown as [Keyframe[]])[0][0],
  ).toMatchObject({ transform: "rotateY(0deg)", opacity: 1 });
  unmount();
  expect(animations[1].cancel).toHaveBeenCalled();
  Element.prototype.animate = original;
});

it("flies above scroll containers and always restores the destination on completion or errors", async () => {
  const original = Element.prototype.animate;
  const completions: (() => void)[] = [];
  Element.prototype.animate = jest.fn(() => ({
    finish: jest.fn(),
    cancel: jest.fn(),
    finished: new Promise<void>((resolve) => completions.push(resolve)),
  })) as unknown as typeof original;
  mockQuery.mockReturnValue(state("play", []));
  const { container, rerender, unmount } = render(<PlayedCards />);
  const first = card("Grace", "g3");
  mockQuery.mockReturnValue(state("play", [first]));
  rerender(<PlayedCards />);
  const destination = container.querySelector<HTMLElement>(
    '[data-play-id="Grace-g3"]',
  )!;
  expect(destination.style.visibility).toBe("hidden");
  const flight = document.querySelector<HTMLElement>(".CardFlight")!;
  expect(flight.parentElement).toBe(document.body);
  expect(flight.style.position).toBe("fixed");
  expect(flight.getAttribute("aria-hidden")).toBe("true");
  expect(flight.querySelector(".PlayedCards-flightBack")).not.toBeNull();
  await act(async () => {
    completions[0]();
  });
  expect(destination.style.visibility).toBe("");
  expect(document.querySelector(".CardFlight")).toBeNull();

  mockQuery.mockReturnValue(state("play", [first, card("Grace", "g4")]));
  rerender(<PlayedCards />);
  const next = container.querySelector<HTMLElement>(
    '[data-play-id="Grace-g4"]',
  )!;
  expect(next.style.visibility).toBe("hidden");
  mockQuery.mockReturnValue({
    ...state("play", [first, card("Grace", "g4")]),
    error: new Error("offline"),
  });
  rerender(<PlayedCards />);
  expect(next.style.visibility).toBe("");
  expect(document.querySelector(".CardFlight")).toBeNull();
  unmount();
  Element.prototype.animate = original;
});
