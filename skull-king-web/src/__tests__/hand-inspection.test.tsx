/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Hand } from "../pages/Game/InGame/Hand/Hand";

const mockPlay = jest.fn();
const mockRefetch = jest.fn();
let mockLegalCardIds = ["yellow-1", "tigress"];
let mockRound = {
  id: 1,
  phase: "play",
  playerTurn: "Anne" as string | null,
  trickColor: "YELLOW",
  myForcedCardId: null as string | null,
  pirateAbility: null as { playerId: string; name: string } | null,
  plankChoice: null as { playerId: string } | null,
};
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
    refetch: mockRefetch,
    data: {
      state: {
        legalCardIds: mockLegalCardIds,
        me: { id: "Anne", name: "Anne", hand: mockCards },
        currentRound: mockRound,
      },
    },
  }),
}));

beforeEach(() => {
  mockLegalCardIds = ["yellow-1", "tigress"];
  mockRound = {
    id: 1,
    phase: "play",
    playerTurn: "Anne",
    trickColor: "YELLOW",
    myForcedCardId: null,
    pirateAbility: null,
    plankChoice: null,
  };
  mockRefetch.mockReset().mockResolvedValue({});
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

test("desktop unavailable cards remain keyboard inspectable without allowing play", () => {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
  render(<Hand />);
  const card = screen.getByRole("listitem", { name: "GREEN 1" });
  expect(card.tabIndex).toBe(0);
  card.focus();
  expect(document.activeElement).toBe(card);
  const reason = document.getElementById(
    card.getAttribute("aria-describedby")!,
  );
  expect(reason?.textContent).toContain("Follow yellow");
  fireEvent.click(screen.getByRole("button", { name: /GREEN 1/ }));
  expect(mockPlay).not.toHaveBeenCalled();
  expect(card.textContent).toContain("Unavailable");
  fireEvent.keyDown(card, { key: "Escape" });
  expect(reason?.className).toContain("dismissed");
});

test("Mary’s forced card uses the server legal set even when it is off suit", () => {
  mockRound.myForcedCardId = "green-1";
  mockLegalCardIds = ["green-1"];
  render(<Hand />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect YELLOW 1" }));
  expect(
    screen.getByRole("region", { name: "Selected card" }).textContent,
  ).toContain("Mary selected a different card");
  expect(screen.queryByRole("button", { name: /Play this card/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Close card preview" }));
  fireEvent.click(screen.getByRole("button", { name: "Inspect GREEN 1" }));
  expect(
    (
      screen.getByRole("button", {
        name: "Play this card: GREEN 1",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});

test.each([
  ["bid", "Anne", "after everyone has bid"],
  ["load", "Anne", "loading the cannon"],
  ["trick_result", null, "next trick"],
  ["play", "Grace", "Grace’s turn"],
  ["play", null, "pending choices"],
])("%s explains why cards cannot be played", (phase, playerTurn, reason) => {
  mockRound.phase = phase!;
  mockRound.playerTurn = playerTurn;
  mockLegalCardIds = [];
  render(<Hand />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect GREEN 1" }));
  expect(
    screen.getByRole("region", { name: "Selected card" }).textContent,
  ).toContain(reason);
  expect(screen.queryByRole("button", { name: /Play this card/ })).toBeNull();
});

test("an in-flight play disables every play and a rejection restores the legal choices", async () => {
  let rejectPlay!: (error: Error) => void;
  mockPlay.mockImplementation(
    () =>
      new Promise((_resolve, reject) => {
        rejectPlay = reject;
      }),
  );
  render(<Hand />);
  fireEvent.click(screen.getByRole("button", { name: "Inspect YELLOW 1" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Play this card: YELLOW 1" }),
  );
  expect(
    screen.getByRole("region", { name: "Selected card" }).textContent,
  ).toContain("Sending your play");
  fireEvent.click(screen.getByRole("button", { name: /YELLOW 1. Sending/ }));
  expect(mockPlay).toHaveBeenCalledTimes(1);
  rejectPlay(new Error("Turn changed"));
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain("Turn changed"),
  );
  expect(
    (
      screen.getByRole("button", {
        name: "Play this card: YELLOW 1",
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});

test.each(["play", "trick_result"])(
  "a pending Pirate power takes precedence in %s",
  (phase) => {
    mockRound.phase = phase;
    mockRound.pirateAbility = { playerId: "Anne", name: "Rosie" };
    mockLegalCardIds = [];
    render(<Hand />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect GREEN 1" }));
    expect(
      screen.getByRole("region", { name: "Selected card" }).textContent,
    ).toContain("Wait for Anne to finish Rosie’s power");
    expect(screen.queryByRole("button", { name: /Play this card/ })).toBeNull();
  },
);
