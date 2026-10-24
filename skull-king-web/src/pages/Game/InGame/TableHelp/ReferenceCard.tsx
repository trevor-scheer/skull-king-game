import { useId } from "react";
import type { TableRulesSettings } from "./RulesReference";
import "./ReferenceCard.scss";

export function ReferenceCard({ settings }: { settings: TableRulesSettings }) {
  const id = useId();
  const d = settings.deckConfig;
  const graybeard = settings.players.some((player) => player.isAutomated);
  const rascal = settings.scoringMode === "rascal";
  const hierarchy = [
    {
      name: "Skull King",
      image: "skullKing",
      rule: `Beats Pirates${d.includeFirstMate ? " and First Mate" : ""}${d.includeMermaids ? "; loses to Mermaid" : " and every numbered card"}.`,
    },
    ...(d.includeFirstMate
      ? [
          {
            name: "First Mate Con",
            rule: `Beats Pirates; loses to Skull King${d.includeMermaids ? " and Mermaid" : ""}.`,
          },
        ]
      : []),
    {
      name: "Pirates",
      image: "pirate-1",
      rule: `Beat numbers${d.includeMermaids ? " and Mermaids" : ""}. First Pirate played wins against other Pirates.`,
    },
    ...(d.includeMermaids
      ? [
          {
            name: "Mermaids",
            image: "mermaid-1",
            rule: "Beat numbers and Skull King; lose to Pirates.",
          },
        ]
      : []),
    {
      name: "Black · trump",
      image: "black-7",
      rule: "Beats all ordinary suits. Highest black number wins.",
    },
    {
      name: "Yellow · green · purple",
      image: "green-12",
      rule: "Without trump or a winning special, highest number of the lead suit wins.",
    },
    {
      name: "Escapes",
      image: "escape-1",
      rule: "Lose to ranking cards. If everyone escapes, the first Escape wins.",
    },
  ];
  const bonuses = [
    {
      name: "Each yellow, green, or purple 14",
      condition: "In a trick you win",
      points: "+10",
    },
    { name: "Each black 14", condition: "In a trick you win", points: "+20" },
    ...(d.includeMermaids
      ? [
          {
            name: "Pirate captures Mermaid",
            condition: "For each Mermaid captured",
            points: "+20",
          },
        ]
      : []),
    {
      name: "Skull King captures Pirate",
      condition: "For each Pirate, including Tigress as Pirate",
      points: "+30",
    },
    ...(d.includeMermaids
      ? [
          {
            name: "Mermaid captures Skull King",
            condition: "Awarded to the Mermaid’s player",
            points: "+40",
          },
        ]
      : []),
  ];
  const exactExtras = [
    ...(d.includeLoot && !graybeard
      ? [
          {
            name: "Loot alliance",
            condition:
              "+20 each to Loot’s player and its capturer, only if both bid exactly. No alliance with yourself.",
            points: "+20",
          },
        ]
      : []),
    ...(d.includeExpansion
      ? [
          {
            name: "Each expansion 7",
            condition: "In a trick you win",
            points: "−5",
          },
          {
            name: "Each expansion 8",
            condition: "In a trick you win",
            points: "+5",
          },
        ]
      : []),
    ...(d.includeFirstMate
      ? [
          {
            name: "Capture First Mate Con",
            condition: `With Skull King${d.includeMermaids ? " or Mermaid" : ""}. First Mate earns no Pirate-capture bonus.`,
            points: "+30",
          },
        ]
      : []),
    ...(d.includeDavyJones
      ? [
          {
            name: "Davy Jones removes a creature",
            condition:
              "For each creature removed, awarded to Davy Jones’ player",
            points: "+20",
          },
        ]
      : []),
    ...(settings.pirateAbilities
      ? [
          {
            name: "Rascal’s wager",
            condition:
              "Win your chosen stake for an exact bid; lose the full stake if you miss.",
            points: "±10 / 20",
          },
        ]
      : []),
  ];
  const exceptions = [
    ...(d.includeKraken
      ? [
          {
            name: "Kraken",
            rule: "Discards the trick; the would-be winner leads next. Releases the lead-suit requirement.",
          },
        ]
      : []),
    ...(d.includeWhiteWhale
      ? [
          {
            name: "White Whale",
            rule: "Highest number wins regardless of suit; characters are neutralized. Keep following an established suit unless Kraken already released it. Without numbers, discard the trick.",
          },
        ]
      : []),
    ...(d.includeStingray
      ? [
          {
            name: "Spotted Stingray",
            rule: "Lowest number wins regardless of suit; characters are neutralized. Keep following an established suit unless Kraken already released it.",
          },
        ]
      : []),
    ...(d.includeDavyJones
      ? [
          {
            name: "Davy Jones’ Locker",
            rule: "Removes every sea creature; remaining cards compete normally.",
          },
        ]
      : []),
    ...(d.includeExpansion && !graybeard
      ? [
          {
            name: "0/14 and Wild 15",
            rule: "Declare 0 or 14; neither earns a 14 bonus. Wild 15 follows yellow, green, or purple, never black.",
          },
        ]
      : []),
    ...(d.includeWalkThePlank && !graybeard
      ? [
          {
            name: "Walk the Plank",
            rule: "Removes one standard Pirate (including Mary, excluding Tigress and First Mate). Removed cards cannot win or earn capture bonuses.",
          },
        ]
      : []),
    ...(d.includeLastVolley
      ? [
          {
            name: "Last Volley",
            rule: "Play again after everyone else, then skip the final trick. No extra play on the final trick.",
          },
        ]
      : []),
  ];
  return (
    <div className="ReferenceCard">
      <p className="ReferenceCard-intro">
        A quick guide to this table’s cards and scoring.
      </p>
      <div className="ReferenceCard-grid">
        <section
          aria-labelledby={`${id}-hierarchy`}
          className="ReferenceCard-face"
        >
          <h3 id={`${id}-hierarchy`}>Card hierarchy</h3>
          <p className="ReferenceCard-caption">
            Strongest first · watch the exceptions
          </p>
          <ul className="ReferenceCard-hierarchy">
            {hierarchy.map(({ name, image, rule }) => (
              <li key={name}>
                {image ? (
                  <img src={`/cards/${image}.jpg`} alt="" />
                ) : (
                  <span className="ReferenceCard-mark" aria-hidden="true">
                    ★
                  </span>
                )}
                <div>
                  <strong>{name}</strong>
                  <p>{rule}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="ReferenceCard-callout">
            <strong>Tigress · you choose:</strong> Declare Pirate or Escape when
            played. Uses that card’s rank and capture bonuses.
          </p>
          {d.includeMermaids && (
            <p className="ReferenceCard-callout">
              <strong>Mermaid exception:</strong> Mermaid wins a trick
              containing both Skull King and a Pirate
              {d.includeFirstMate ? ", or both First Mate and a Pirate" : ""}.
            </p>
          )}
          <p className="ReferenceCard-note">
            Equal ranks favor the first played. Follow the lead suit when you
            can, or choose a special card
            {d.includeExpansion && !graybeard
              ? " (Wild 15 follows its number-card suit rules)"
              : ""}
            .
            {d.includeExpansion && settings.pirateAbilities
              ? " A card forced by Mary must be played."
              : ""}
            {graybeard ? " Graybeard’s Tigress is always Escape." : ""}
          </p>
        </section>
        <section
          aria-labelledby={`${id}-bonuses`}
          className="ReferenceCard-face"
        >
          <h3 id={`${id}-bonuses`}>Bonus points</h3>
          <p className="ReferenceCard-caption">
            Earned in addition to your bid score
          </p>
          <p className="ReferenceCard-callout">
            {rascal ? (
              <>
                Exact bid: full capture bonuses. Off by one:{" "}
                <strong>half the bonuses below</strong>
                {settings.cannonball
                  ? " with Grapeshot only; Cannonball requires an exact bid"
                  : ""}
                . Farther off: none.
              </>
            ) : (
              <>
                <strong>Make your bid exactly</strong> to earn bonuses.
              </>
            )}
          </p>
          <dl className="ReferenceCard-bonuses">
            {bonuses.map(({ name, condition, points }) => (
              <div key={name}>
                <dt>
                  {name}
                  <small>{condition}</small>
                </dt>
                <dd>{points}</dd>
              </div>
            ))}
          </dl>
          {exactExtras.length > 0 && (
            <>
              <h4>Exact-bid extras</h4>
              <p className="ReferenceCard-note">
                No half credit for these, even with Rascal scoring.
              </p>
              <dl className="ReferenceCard-bonuses">
                {exactExtras.map(({ name, condition, points }) => (
                  <div key={name}>
                    <dt>
                      {name}
                      <small>{condition}</small>
                    </dt>
                    <dd>{points}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <div className="ReferenceCard-scoring">
            <h4>{rascal ? "Rascal" : "Classic"} bid score</h4>
            <p>
              {rascal
                ? "Exact: +10 per card dealt. Off by one: half. Farther off: zero."
                : "Exact nonzero bid: +20 per trick won. Miss: −10 per trick away from your bid. Zero bid: +10 per card dealt if exact, −10 per card dealt if missed."}
            </p>
            {rascal && settings.cannonball && (
              <p>
                Choose each round: Grapeshot uses the scores above; Cannonball
                gives +15 per card dealt if exact, zero if missed.
              </p>
            )}
          </div>
        </section>
      </div>
      {exceptions.length > 0 && (
        <details className="ReferenceCard-exceptions">
          <summary>Special rules for this deck</summary>
          {(d.includeKraken || d.includeWhiteWhale || d.includeStingray) && (
            <p>
              The last sea creature played determines the effect, unless Davy
              Jones removes them. Discarded tricks earn no capture bonuses.
              White Whale and Stingray preserve printed 14 bonuses, but suppress
              character and Loot bonuses.
            </p>
          )}
          <dl>
            {exceptions.map(({ name, rule }) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{rule}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <p className="ReferenceCard-source">
        Adapted for this table from the publisher’s{" "}
        <a
          href="https://cdn.shopify.com/s/files/1/0565/3230/4053/files/SK_Heirarchy.jpg?v=1672938216"
          target="_blank"
          rel="noreferrer"
        >
          hierarchy
        </a>{" "}
        and{" "}
        <a
          href="https://cdn.shopify.com/s/files/1/0565/3230/4053/files/SK_Bonus_Points.jpg?v=1672938216"
          target="_blank"
          rel="noreferrer"
        >
          bonus reference cards
        </a>
        . Full rules and powers are in Table options.
      </p>
    </div>
  );
}
