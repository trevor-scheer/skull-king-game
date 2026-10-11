const special: Record<string, { name: string; rule: string }> = {
  maryThorne: {
    name: "Mary Thorne",
    rule: "Pirate · Optional power: force one random card next trick",
  },
  firstMate: {
    name: "First Mate Con",
    rule: "Beats Pirates · Loses to Mermaids and Skull King · Captured Pirate powers",
  },
  stingray: {
    name: "Spotted Stingray",
    rule: "Lowest number wins · Last sea monster takes effect",
  },
  davyJones: {
    name: "Davy Jones’ Locker",
    rule: "Destroys all sea monsters · +20 each if your bid is exact",
  },
  walkThePlank: {
    name: "Walk the Plank",
    rule: "Never wins · Remove one Pirate at the end of the trick",
  },
  lastVolley: {
    name: "Last Volley",
    rule: "Play again after everyone · Skip the final trick",
  },
};
export function expansionCardDescription(
  id: string,
  color?: string,
  number?: number,
) {
  if (special[id]) return special[id];
  if (id === "wild-15")
    return {
      name: `Wild Monkey 15${color ? ` · ${color}` : ""}`,
      rule: "Yellow, green, or purple · Follow the lead suit",
    };
  if (id.includes("zero-fourteen"))
    return {
      name: `${color ?? id.split("-")[0]} ${number ?? "0 / 14"}`,
      rule: "Choose 0 or 14 · No capture bonus",
    };
  if (id.includes("expansion-"))
    return {
      name: `${color ?? id.split("-")[0]} ${number ?? id.slice(-1)}`,
      rule: `${id.endsWith("7") ? "−5" : "+5"} points if your bid is exact`,
    };
  return null;
}
