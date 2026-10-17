/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
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
  expect(animate).toHaveBeenCalledTimes(1);
  mockQuery.mockReturnValue(state("play", [{ ...first }]));
  rerender(<PlayedCards />);
  expect(animate).toHaveBeenCalledTimes(1);
  expect(animations[0].finish).not.toHaveBeenCalled();
  mockQuery.mockReturnValue(state("play", [first, card("Grace", "g4")]));
  rerender(<PlayedCards />);
  expect(animations[0].finish).toHaveBeenCalledTimes(1);
  expect(animate).toHaveBeenCalledTimes(2);
  unmount();
  expect(animations[1].cancel).toHaveBeenCalled();
  Element.prototype.animate = original;
});
