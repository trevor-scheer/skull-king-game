/** @jest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import { GameStateQuery } from "../types/graphqlTypes";
import { tableActivity } from "../pages/Game/InGame/TurnStatus/tableActivity";
import { TurnStatus } from "../pages/Game/InGame/TurnStatus/TurnStatus";
import { GameTable } from "../pages/Game/InGame/GameTable/GameTable";

type State = NonNullable<GameStateQuery["state"]>;
function state(round: Partial<NonNullable<State["currentRound"]>> = {}): State {
  return {
    me: { id: "ada", name: "Ada", isAutoplay: false },
    players: [
      { id: "ada", name: "Ada" },
      { id: "grace", name: "Grace" },
    ],
    currentRound: {
      id: 1,
      phase: "play",
      playerTurn: "ada",
      cardsPlayed: [],
      hands: [],
      ...round,
    },
  } as unknown as State;
}

test("identifies the current actor and only invites the owning human to play", () => {
  expect(tableActivity(state(), false)).toMatchObject({
    title: "Your turn",
    yourTurn: true,
    actor: "ada",
  });
  expect(tableActivity(state(), true)).toMatchObject({
    title: "Ada’s turn",
    yourTurn: false,
  });
  expect(tableActivity(state({ playerTurn: "grace" }), false)).toMatchObject({
    title: "Grace’s turn",
    actor: "grace",
    yourTurn: false,
  });
  const autoplay = state();
  autoplay.me!.isAutoplay = true;
  expect(tableActivity(autoplay, false)).toMatchObject({
    yourTurn: false,
    detail: expect.stringContaining("Autoplay is playing for you"),
  });
});

test("pending choices override the next card player, including during results", () => {
  expect(
    tableActivity(
      state({
        pirateAbility: { id: "choice1", name: "Mary", playerId: "grace" },
      }),
      false,
    ),
  ).toMatchObject({
    title: "Grace is choosing",
    actor: "grace",
    ownAction: false,
    seatLabel: "Choosing",
  });
  const own = tableActivity(
    state({
      phase: "trick_result",
      plankChoice: { id: "plank1", playerId: "ada" },
    }),
    false,
  );
  expect(own).toMatchObject({
    title: "Your choice",
    detail: "Choose a Pirate to remove.",
    actor: "ada",
    ownAction: true,
  });
  expect(own.yourTurn).toBeUndefined();
});

test.each([
  [{ phase: "bid", myBid: 0 }, "Secret bidding", "Your bid is in."],
  [{ phase: "bid", bidRevealEndsAt: 1000 }, "Bids locked", "All together now"],
  [{ phase: "load" }, "Secret cannon loads", "Players are choosing"],
  [{ phase: "trick_result" }, "Trick complete", "Review the result"],
])("never advertises a stale playerTurn during %j", (round, title, detail) => {
  const activity = tableActivity(state(round), false);
  expect(activity.title).toBe(title);
  expect(activity.detail).toContain(detail);
  expect(activity.actor).toBeUndefined();
  expect(activity.yourTurn).toBeUndefined();
});

test("turn arrivals cue once, do not steal focus, and cue again for a new trick", () => {
  jest.useFakeTimers();
  const { rerender, container } = render(
    <>
      <button>Table options</button>
      <TurnStatus activity={tableActivity(state(), false)} />
    </>,
  );
  const status = screen.getByRole("status");
  expect(status.className).not.toContain("arriving");
  expect(status.getAttribute("aria-atomic")).toBe("true");
  const button = screen.getByRole("button");
  button.focus();
  const update = (next: State) =>
    rerender(
      <>
        <button>Table options</button>
        <TurnStatus activity={tableActivity(next, false)} />
      </>,
    );
  update(state({ playerTurn: "grace" }));
  update(state());
  expect(status.className).toContain("arriving");
  expect(document.activeElement).toBe(button);
  act(() => {
    jest.advanceTimersByTime(1400);
  });
  expect(status.className).not.toContain("arriving");
  update(state());
  expect(status.className).not.toContain("arriving");
  update(state({ hands: [{ id: "trick1" }] }));
  expect(status.className).toContain("arriving");
  update(state({ phase: "trick_result" }));
  expect(container.querySelector(".TurnStatus--yours")).toBeNull();
  jest.useRealTimers();
});

test("opponent seats mark the actor by ID with a written action label", () => {
  const players = [
    {
      id: "grace",
      name: "Captain Grace",
      handCount: 3,
      isAutomated: false,
      tricksWon: 0,
    },
  ];
  const { container, rerender } = render(
    <GameTable
      players={players}
      currentPlayerId="ada"
      playerTurn="grace"
      activeLabel="Choosing"
    >
      <p>Cards</p>
    </GameTable>,
  );
  expect(screen.getByText("▶ Choosing")).toBeTruthy();
  expect(
    container.querySelector('[aria-current="true"]')?.textContent,
  ).toContain("Captain Grace");
  rerender(
    <GameTable players={players} currentPlayerId="ada" playerTurn="">
      <p>Cards</p>
    </GameTable>,
  );
  expect(container.querySelector('[aria-current="true"]')).toBeNull();
});
