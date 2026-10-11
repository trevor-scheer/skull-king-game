/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Tutorial } from "../pages/Tutorial/Tutorial";

test("the tutorial explains wrong answers and requires a correct play before advancing", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Tutorial />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "YELLOW 14" }));
  expect(screen.getByRole("status").textContent).toMatch(
    /Try again.*follow green/,
  );
  expect(
    (screen.getByRole("button", { name: "Next lesson" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  for (const name of [
    "GREEN 3",
    "BLACK 2",
    "Mermaid",
    "Avoid winning another trick",
    "40",
  ]) {
    fireEvent.click(screen.getByRole("button", { name }));
    fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
  }
  expect(
    screen.getByRole("heading", { name: "You’re ready for the table." }),
  ).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Practice again" }));
  expect(screen.getByText("Lesson 1 of 5")).toBeTruthy();
});
