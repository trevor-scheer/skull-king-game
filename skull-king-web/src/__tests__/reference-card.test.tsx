/** @jest-environment jsdom */
import { render, screen, within } from "@testing-library/react";
import { ReferenceCard } from "../pages/Game/InGame/TableHelp/ReferenceCard";
import type { TableRulesSettings } from "../pages/Game/InGame/TableHelp/RulesReference";
import { ScoringMode } from "../types/graphqlTypes";

const settings: TableRulesSettings = {
  scoringMode: ScoringMode.Classic,
  pirateAbilities: false,
  cannonball: false,
  players: [],
  deckConfig: {
    includeMermaids: true,
    includeKraken: false,
    includeWhiteWhale: false,
    includeLoot: false,
    includeExpansion: false,
    includeFirstMate: false,
    includeStingray: false,
    includeDavyJones: false,
    includeWalkThePlank: false,
    includeLastVolley: false,
  },
};

const expanded: TableRulesSettings = {
  ...settings,
  pirateAbilities: true,
  deckConfig: {
    includeMermaids: true,
    includeKraken: true,
    includeWhiteWhale: true,
    includeLoot: true,
    includeExpansion: true,
    includeFirstMate: true,
    includeStingray: true,
    includeDavyJones: true,
    includeWalkThePlank: true,
    includeLastVolley: true,
  },
};

test("the standard reference explains the hierarchy exception and physical reference bonus values", () => {
  render(<ReferenceCard settings={settings} />);
  const hierarchy = screen.getByRole("region", { name: "Card hierarchy" });
  expect(hierarchy.textContent).toContain(
    "Mermaid wins a trick containing both Skull King and a Pirate",
  );
  const bonuses = screen.getByRole("region", { name: "Bonus points" });
  expect(bonuses.textContent).toContain("Make your bid exactly");
  for (const [capture, points] of [
    ["Each yellow, green, or purple 14", "+10"],
    ["Each black 14", "+20"],
    ["Pirate captures Mermaid", "+20"],
    ["Skull King captures Pirate", "+30"],
    ["Mermaid captures Skull King", "+40"],
  ]) {
    expect(
      within(bonuses).getByText(capture).parentElement?.textContent,
    ).toContain(points);
  }
  expect(screen.queryByText("Exact-bid extras")).toBeNull();
  expect(screen.queryByText("Special rules for this deck")).toBeNull();
  expect(screen.queryByText(/card forced by Mary/)).toBeNull();
});

test("the simple deck does not suggest absent Mermaids or expansion cards", () => {
  const { container } = render(
    <ReferenceCard
      settings={{
        ...settings,
        deckConfig: { ...settings.deckConfig, includeMermaids: false },
      }}
    />,
  );
  expect(container.textContent).not.toMatch(
    /Mermaid|First Mate|Loot|Wild 15|Mary/,
  );
});

test("Rascal keeps half capture bonuses separate from exact-only extras and Cannonball", () => {
  const { container } = render(
    <ReferenceCard
      settings={{
        ...expanded,
        scoringMode: ScoringMode.Rascal,
        cannonball: true,
      }}
    />,
  );
  expect(container.textContent).toContain(
    "half the bonuses below with Grapeshot only; Cannonball requires an exact bid",
  );
  expect(
    screen.getByRole("heading", { name: "Exact-bid extras" }).nextElementSibling
      ?.textContent,
  ).toContain("No half credit");
  expect(
    screen.getByText("Each expansion 7").parentElement?.textContent,
  ).toContain("−5");
  expect(
    screen.getByText("Each expansion 8").parentElement?.textContent,
  ).toContain("+5");
  expect(
    screen.getByText("Loot alliance").parentElement?.textContent,
  ).toContain("only if both bid exactly");
  expect(
    screen.getByText("Rascal’s wager").parentElement?.textContent,
  ).toContain("lose the full stake if you miss");
  expect(container.textContent).toContain("neither earns a 14 bonus");
  expect(container.textContent).toContain(
    "White Whale and Stingray preserve printed 14 bonuses",
  );
});

test("Graybeard hides excluded cards even when their deck settings are on", () => {
  const { container } = render(
    <ReferenceCard
      settings={{
        ...expanded,
        players: [
          {
            id: "Graybeard",
            name: "Graybeard",
            handCount: 0,
            tricksWon: 0,
            isAutomated: true,
          },
        ],
      }}
    />,
  );
  expect(screen.queryByText("Loot alliance")).toBeNull();
  expect(screen.queryByText("Walk the Plank")).toBeNull();
  expect(screen.queryByText("0/14 and Wild 15")).toBeNull();
  expect(container.textContent).toContain(
    "Graybeard’s Tigress is always Escape",
  );
  expect(screen.getByText("Each expansion 7")).toBeTruthy();
});
