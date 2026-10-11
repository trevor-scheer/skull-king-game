/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Spectator } from "../pages/Game/Spectator/Spectator";
const mockQuery = jest.fn((_options?: unknown) => ({
  data: {
    state: {
      id: "room",
      deckConfig: { includeMermaids: true },
      scoringMode: "classic",
      pirateAbilities: false,
      cannonball: false,
      players: [
        {
          id: "Anne",
          name: "Anne",
          handCount: 3,
          tricksWon: 1,
          bid: 1,
          isAutomated: false,
        },
      ],
      me: null,
      currentRound: {
        phase: "play",
        playerTurn: "Anne",
        roundNumber: 1,
        cardsPerPlayer: 3,
        hands: [],
        trickColor: "GREEN",
      },
    },
  },
}));
jest.mock("../hooks/PlayerTokenContext", () => ({
  usePlayerToken: () => [undefined],
}));
jest.mock("../hooks/useGameId", () => ({ useGameId: () => "room" }));
jest.mock("../types/graphqlTypes", () => ({
  useGameStateQuery: (options: unknown) => mockQuery(options),
}));
jest.mock("../pages/Game/InGame/Hand/Hand", () => ({
  Hand: () => {
    throw Error("Spectator must not request a private hand");
  },
}));
jest.mock("../pages/Game/InGame/BidForm/BidForm", () => ({
  BidForm: () => {
    throw Error("Spectator cannot bid");
  },
}));
jest.mock("../pages/Game/InGame/PlayedCards/PlayedCards", () => ({
  PlayedCards: () => <p>Public trick cards</p>,
}));
jest.mock("../pages/Game/InGame/Scorecard/Scorecard", () => ({
  Scorecard: () => <p>Public scorecard</p>,
}));
test("spectators query without a seat and see public play and score views", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Spectator />
    </MemoryRouter>,
  );
  expect(mockQuery).toHaveBeenCalledWith(
    expect.objectContaining({ variables: { gameId: "room", playerToken: "" } }),
  );
  expect(
    screen.getByRole("heading", { name: "Watching the table" }),
  ).toBeTruthy();
  expect(screen.getByText("Public trick cards")).toBeTruthy();
  expect(screen.getByText("Public scorecard")).toBeTruthy();
  expect(screen.queryByText("Sound and vibration")).toBeNull();
});
