import { Link } from "react-router-dom";
import { GameStateQuery } from "../../../../types/graphqlTypes";

export type TableRulesSettings = Pick<
  NonNullable<GameStateQuery["state"]>,
  "deckConfig" | "scoringMode" | "pirateAbilities" | "cannonball" | "players"
>;
export function RulesReference({ settings }: { settings: TableRulesSettings }) {
  const d = settings.deckConfig;
  const graybeard = settings.players.some((player) => player.isAutomated);
  return (
    <details className="TableHelp">
      <summary>Rules for this table</summary>
      <p>
        Predict how many tricks you will win, then try to win exactly that many.
        A trick is one play from each player, except Last Volley. The winner
        normally leads next.
      </p>
      <p>
        Follow the lead suit when you have it. You may always choose a special
        card instead. Black is trump: it beats ordinary suits. Equal ranks go to
        the first played.
      </p>
      {graybeard && (
        <p>
          Two-player play adds Graybeard’s automatic hand. He reveals second
          when a human leads, ignores suit, and plays Tigress as Escape. Loot,
          Wild 15, Walk the Plank, and 0/14 cards are excluded.
        </p>
      )}
      {(d.includeKraken || d.includeWhiteWhale || d.includeStingray) && (
        <p>
          When several sea monsters appear, the last one determines the effect.
          Davy Jones removes them all if included and played.
        </p>
      )}
      <dl>
        <dt>Escape / Tigress</dt>
        <dd>
          Escape usually loses. Tigress is declared as Pirate or Escape when
          played. The first Escape wins when every card behaves as an Escape.
        </dd>
        <dt>Pirates / Skull King</dt>
        <dd>
          Pirates beat numbers; the first Pirate wins. Skull King beats Pirates.
        </dd>
        {d.includeMermaids && (
          <>
            <dt>Mermaids</dt>
            <dd>
              Beat numbers and Skull King, but lose to Pirates. In a trick with
              Mermaid, Pirate, and Skull King, Mermaid wins. Mermaid capturing
              Skull King earns 40; Pirate capturing Mermaid earns 20.
            </dd>
          </>
        )}
        <dt>Capture bonuses</dt>
        <dd>
          Ordinary colored 14s earn 10; black 14 earns 20. Skull King earns 30
          per captured Pirate.
        </dd>
        {d.includeKraken && (
          <>
            <dt>Kraken</dt>
            <dd>
              Discards the trick and releases the lead-suit requirement. The
              would-be winner leads next.
            </dd>
          </>
        )}
        {d.includeWhiteWhale && (
          <>
            <dt>White Whale</dt>
            <dd>
              Highest number wins, regardless of suit; ties favor first played.
              An established lead suit must still be followed. No numbered card
              means a discarded trick.
            </dd>
          </>
        )}
        {d.includeLoot && (
          <>
            <dt>Loot</dt>
            <dd>
              Acts as Escape. Its player and the trick winner earn 20 each only
              if both bid exactly and they are different players.
            </dd>
          </>
        )}
        {d.includeExpansion && (
          <>
            <dt>Expansion numbers</dt>
            <dd>
              Extra 7: −5 when captured; extra 8: +5.{" "}
              {!graybeard && (
                <>
                  Declare 0/14 when played; neither choice earns capture points.
                  Wild 15 follows yellow, green, or purple and never becomes
                  black.
                </>
              )}
            </dd>
            <dt>Mary Thorne</dt>
            <dd>
              A Pirate. With powers enabled, her winner chooses whose unseen
              random card must be played next trick, regardless of suit.
            </dd>
          </>
        )}
        {d.includeFirstMate && (
          <>
            <dt>First Mate Con</dt>
            <dd>
              Beats Pirates; loses to Mermaid and Skull King. May use all
              captured Pirate powers. Mermaid or Skull King capturing him earns
              30.
            </dd>
          </>
        )}
        {d.includeStingray && (
          <>
            <dt>Spotted Stingray</dt>
            <dd>
              Lowest number wins regardless of suit. The last sea monster played
              determines the effect.
            </dd>
          </>
        )}
        {d.includeDavyJones && (
          <>
            <dt>Davy Jones’ Locker</dt>
            <dd>
              Removes all sea monsters and itself at trick end. Its player earns
              20 per destroyed monster with an exact bid.
            </dd>
          </>
        )}
        {d.includeWalkThePlank && (
          <>
            <dt>Walk the Plank</dt>
            <dd>
              Remove one standard Pirate at trick end. If several are present,
              its player chooses. The removed Pirate cannot win or earn capture
              points.
            </dd>
          </>
        )}
        {d.includeLastVolley && (
          <>
            <dt>Last Volley</dt>
            <dd>
              Play an extra card after everyone else, then skip the final trick.
              On the final trick, no extra card is played.
            </dd>
          </>
        )}
        {settings.pirateAbilities && (
          <>
            <dt>Pirate abilities</dt>
            <dd>
              Rosie chooses the next leader. Rascal wagers 0, 10, or 20. Juanita
              sees undealt cards privately. Bendt draws two and discards two.
              Harry adjusts the bid by one. Powers pause the table while their
              owner chooses.
            </dd>
          </>
        )}
        <dt>
          {settings.scoringMode === "rascal"
            ? "Rascal scoring"
            : "Classic scoring"}
        </dt>
        <dd>
          {settings.scoringMode === "rascal"
            ? "An exact bid earns 10 per card dealt. Missing by one earns half; farther misses earn no bid points. Ordinary captures also earn half when off by one."
            : "An exact nonzero bid earns 20 per trick. Missing loses 10 per trick off. A zero bid earns or loses 10 per card dealt."}{" "}
          Classic capture bonuses, Loot, and expansion adjustments require exact
          bids. A failed wager loses its stake.
        </dd>
        {settings.cannonball && (
          <>
            <dt>Cannonball</dt>
            <dd>
              After bidding, secretly choose grapeshot (10 per card for an exact
              bid; half if off by one) or Cannonball (15 per card for an exact
              bid; zero if missed). Loads are revealed together.
            </dd>
          </>
        )}
      </dl>
      <p>
        <Link to="/learn">Practice with the interactive tutorial</Link> ·{" "}
        <a
          href="https://www.grandpabecksgames.com/pages/skull-king"
          target="_blank"
          rel="noreferrer"
        >
          Publisher’s rules
        </a>
      </p>
    </details>
  );
}
