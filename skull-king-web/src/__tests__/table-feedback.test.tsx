/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TableFeedback } from "../pages/Game/InGame/TableHelp/TableFeedback";
import { TableAudio } from "../pages/Game/InGame/TableHelp/tableAudio";

jest.mock("../pages/Game/InGame/TableHelp/tableAudio");
const MockAudio = jest.mocked(TableAudio);
function bus() {
  return MockAudio.mock.instances[0] as jest.Mocked<TableAudio>;
}
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

test("new plays cue once, while loading an existing table stays silent", () => {
  const { rerender } = render(
    <TableFeedback
      yourTurn={false}
      roundKey="round-1"
      playedCardEvent="card-1"
    />,
  );
  expect(bus().cue).not.toHaveBeenCalled();
  rerender(
    <TableFeedback
      yourTurn={false}
      roundKey="round-1"
      playedCardEvent="card-2"
    />,
  );
  expect(bus().cue).toHaveBeenCalledTimes(1);
  expect(bus().cue).toHaveBeenCalledWith("play");
  rerender(
    <TableFeedback
      yourTurn={false}
      roundKey="round-1"
      playedCardEvent="card-2"
    />,
  );
  expect(bus().cue).toHaveBeenCalledTimes(1);
});

test("sound stays opt-in and muting immediately silences the bus", async () => {
  render(<TableFeedback yourTurn={false} />);
  fireEvent.click(screen.getByText("Sound and vibration"));
  expect(bus().setEnabled).toHaveBeenLastCalledWith(false);
  bus().unlock.mockResolvedValue(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "Sound cues" }));
  expect(localStorage.getItem("sk-sound")).toBe("true");
  await waitFor(() => expect(bus().cue).toHaveBeenCalledWith("play"));
  fireEvent.click(screen.getByRole("checkbox", { name: "Sound cues" }));
  expect(bus().setEnabled).toHaveBeenLastCalledWith(false);
  expect(localStorage.getItem("sk-sound")).toBe("false");
});

test("hidden tables discard incoming cues and stop playing sound", () => {
  const { rerender } = render(
    <TableFeedback yourTurn={false} roundKey="round-1" />,
  );
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  fireEvent(document, new Event("visibilitychange"));
  expect(bus().stop).toHaveBeenCalled();
  rerender(<TableFeedback yourTurn={true} roundKey="round-1" />);
  expect(bus().cue).not.toHaveBeenCalled();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  rerender(<TableFeedback yourTurn={true} roundKey="round-1" />);
  expect(bus().cue).not.toHaveBeenCalled();
});
