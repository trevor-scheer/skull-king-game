/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Hand } from "../pages/Game/InGame/Hand/Hand";

const mockPlay = jest.fn();
const mockCards = [
  { __typename: "ColoredCard", id: "yellow-1", color: "YELLOW", number: 1 },
  { __typename: "ColoredCard", id: "green-1", color: "GREEN", number: 1 },
  { __typename: "SpecialCard", id: "tigress", type: "tigress" },
];
jest.mock("../hooks/PlayerTokenContext", () => ({
  usePlayerToken: () => ["seat"],
}));
jest.mock("../hooks/useGameId", () => ({ useGameId: () => "room" }));
jest.mock("../types/graphqlTypes", () => ({
  usePlayColoredCardMutation: () => [mockPlay],
  usePlaySpecialCardMutation: () => [mockPlay],
  useMyHandQuery: () => ({
    data: {
      state: {
        legalCardIds: ["yellow-1", "tigress"],
        me: { name: "Anne", hand: mockCards },
        currentRound: {
          id: 1,
          phase: "play",
          playerTurn: "Anne",
          trickColor: "YELLOW",
        },
      },
    },
  }),
}));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  mockPlay.mockReset().mockResolvedValue({});
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: query === "(max-width: 600px)",
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

test("phone inspection waits for an explicit play and preserves the preview after failure", async () => {
  mockPlay.mockRejectedValue(new Error("Connection interrupted"));
  render(<Hand />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect YELLOW 1" }));
  expect(mockPlay).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Play this card: YELLOW 1" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Connection interrupted",
    ),
  );
  expect(mockPlay).toHaveBeenCalledTimes(1);
  expect(
    (
      screen.getByRole("button", {
        name: "Play this card: YELLOW 1",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});

test("inspecting an illegal card does not expose an enabled play action", () => {
  render(<Hand />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect GREEN 1" }));
  expect(screen.queryByRole("button", { name: /Play this card/ })).toBeNull();
  expect(mockPlay).not.toHaveBeenCalled();
  expect(
    screen.getByRole("region", { name: "Selected card" }).textContent,
  ).toContain("Follow yellow");
});

test("Tigress inspection preserves the explicit declaration before playing", async () => {
  render(<Hand />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect Tigress" }));
  expect(mockPlay).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Play as Escape" }));
  await waitFor(() =>
    expect(mockPlay).toHaveBeenCalledWith({
      variables: {
        gameId: "room",
        playerToken: "seat",
        cardId: "tigress",
        selection: "escape",
      },
    }),
  );
});
