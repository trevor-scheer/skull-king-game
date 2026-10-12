import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  useGamesQuery,
  useNewGameMutation,
  DeckConfigInput,
  ScoringMode,
} from "../../types/graphqlTypes";
import "./Home.scss";

interface OptionalCard {
  key: keyof DeckConfigInput;
  name: string;
  description: string;
}

const OPTIONAL_CARDS: OptionalCard[] = [
  {
    key: "includeMermaids",
    name: "Mermaids",
    description:
      "Beat numbered cards and capture the Skull King; lose to Pirates otherwise",
  },
  {
    key: "includeKraken",
    name: "Kraken",
    description: "Destroys the trick, no one wins",
  },
  {
    key: "includeWhiteWhale",
    name: "White Whale",
    description: "Highest number wins, ignoring special cards",
  },
  {
    key: "includeLoot",
    name: "Loot",
    description: "Creates an alliance for bonus points",
  },
  {
    key: "includeExpansion",
    name: "Expansion numbers & Mary Thorne",
    description:
      "Extra 7s and 8s, 0/14 choices, Wild 15, and Mary’s forced-card power",
  },
  {
    key: "includeFirstMate",
    name: "First Mate Con",
    description: "Beats Pirates and can use their captured powers",
  },
  {
    key: "includeStingray",
    name: "Spotted Stingray",
    description: "Lowest number wins, ignoring suits",
  },
  {
    key: "includeDavyJones",
    name: "Davy Jones’ Locker",
    description:
      "Removes sea creatures and earns 20 per creature on an exact bid",
  },
  {
    key: "includeWalkThePlank",
    name: "Walk the Plank",
    description: "Removes a Pirate at the end of the trick",
  },
  {
    key: "includeLastVolley",
    name: "The Last Volley",
    description: "Play an extra card, then skip the final trick",
  },
];

export function Home() {
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);
  const [pirateAbilities, setPirateAbilities] = useState(false);
  const [scoringMode, setScoringMode] = useState(ScoringMode.Classic);
  const [roundPreset, setRoundPreset] = useState("standard");
  const [customRounds, setCustomRounds] = useState("1, 2, 3, 4, 5");
  const [tieBreakers, setTieBreakers] = useState(true);
  const [cannonball, setCannonball] = useState(false);
  const [createFailed, setCreateFailed] = useState(false);
  const [deckConfig, setDeckConfig] = useState<DeckConfigInput>({
    includeMermaids: true,
    includeKraken: false,
    includeWhiteWhale: false,
    includeLoot: false,
  });

  const { data, loading, error } = useGamesQuery({ pollInterval: 10000 });

  if (error) console.error(error);

  const [createGame, { loading: creating }] = useNewGameMutation({
    refetchQueries: ["Games"],
  });

  const toggleCard = (key: keyof DeckConfigInput) => {
    setDeckConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const chooseDeck = (preset: "simple" | "mermaids" | "all" | "expansion") => {
    setDeckConfig({
      includeMermaids: preset !== "simple",
      includeKraken: preset === "all" || preset === "expansion",
      includeWhiteWhale: preset === "all" || preset === "expansion",
      includeLoot: preset === "all" || preset === "expansion",
      includeExpansion: preset === "expansion",
      includeFirstMate: preset === "expansion",
      includeStingray: preset === "expansion",
      includeDavyJones: preset === "expansion",
      includeWalkThePlank: preset === "expansion",
      includeLastVolley: preset === "expansion",
    });
  };

  async function launchGame() {
    setCreateFailed(false);
    try {
      const roundSchedule =
        roundPreset === "custom"
          ? customRounds.split(",").map((value) => Number(value.trim()))
          : ROUND_PRESETS[roundPreset].cards;
      if (
        !roundSchedule.length ||
        roundSchedule.length > 20 ||
        roundSchedule.some(
          (value) => !Number.isInteger(value) || value < 1 || value > 10,
        )
      )
        throw new Error("Choose 1–20 rounds of 1–10 cards.");
      const result = await createGame({
        variables: {
          deckConfig,
          pirateAbilities,
          scoringMode,
          roundSchedule,
          tieBreakers,
          cannonball: scoringMode === ScoringMode.Rascal && cannonball,
        },
      });
      if (!result.data?.newGame) throw new Error("Missing game");
      setRedirectTo(result.data.newGame);
    } catch {
      setCreateFailed(true);
    }
  }

  if (redirectTo) {
    return <Navigate to={`/game/${redirectTo}`} />;
  }

  if (loading) {
    return (
      <div className="Home Home--loading">
        <div className="Home-spinner" />
        <p>Loading the fleet...</p>
      </div>
    );
  }

  if (!data?.games) {
    return (
      <div className="Home Home--error">
        <p>Something went wrong. Try refreshing the page.</p>
      </div>
    );
  }

  const selectedPreset = DECK_PRESETS.find((preset) =>
    OPTIONAL_CARDS.every(
      (card) =>
        Boolean(deckConfig[card.key]) ===
        (preset.key === "expansion" ||
          (card.key === "includeMermaids" && preset.key !== "simple") ||
          (["includeKraken", "includeWhiteWhale", "includeLoot"].includes(
            card.key,
          ) &&
            preset.key === "all")),
    ),
  );

  return (
    <div className="Home">
      <section className="Home-hero" aria-labelledby="home-title">
        <div className="Home-heroCopy">
          <p className="Home-eyebrow">Fortune favors the bold</p>
          <h1 id="home-title" className="Home-title">
            Rule the seas.
            <br />
            <em>Read the room.</em>
          </h1>
          <p className="Home-tagline">
            Big bids. Cunning pirates. Glorious upsets. Bring your crew together
            for a game of Skull King.
          </p>
          <div className="Home-heroActions">
            <a className="Home-primaryLink" href="#new-voyage">
              Gather your crew <span aria-hidden="true">↗</span>
            </a>
            <Link to="/learn" className="Home-learnLink">
              Learn to play <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="Home-heroNote">
            Play with friends or practice pirates. No account needed.
          </p>
        </div>
        <div className="Home-art" aria-hidden="true">
          <div className="Home-compass">
            <span>N</span>
            <span>E</span>
            <span>S</span>
            <span>W</span>
          </div>
          <img
            className="Home-heroCard Home-heroCard--left"
            src="/cards/mermaid-1.jpg"
            alt=""
          />
          <img
            className="Home-heroCard Home-heroCard--right"
            src="/cards/pirate-1.jpg"
            alt=""
          />
          <img
            className="Home-heroCard Home-heroCard--king"
            src="/cards/skullKing.jpg"
            alt=""
          />
          <span className="Home-artCaption">
            A little strategy. A lot of swagger.
          </span>
        </div>
      </section>

      <div className="Home-introStrip">
        <span>
          <b>01</b> Bid your tricks
        </span>
        <span>
          <b>02</b> Play your hand
        </span>
        <span>
          <b>03</b> Claim your glory
        </span>
      </div>
      <section
        className="Home-content"
        id="new-voyage"
        aria-labelledby="new-voyage-title"
      >
        <div className="Home-setupIntro">
          <p className="Home-eyebrow">Your table. Your rules.</p>
          <h2 id="new-voyage-title">Start a new voyage</h2>
          <p>
            Choose a deck, invite your crew, and set sail. Add practice pirates
            in the lobby for a solo session.
          </p>
          <div className="Home-setupFacts">
            <span>2–8 players</span>
            <span>Up to 9 with expansion</span>
            <span>Live multiplayer</span>
          </div>
        </div>
        <div className="Home-setupPanel">
          <div className="Home-sectionHeading">
            <span className="Home-step">01</span>
            <div>
              <h3>Choose your deck</h3>
              <p>A familiar favorite or a wilder sea.</p>
            </div>
          </div>
          <div className="Home-presets" role="group" aria-label="Deck presets">
            {DECK_PRESETS.map((preset) => (
              <button
                key={preset.key}
                aria-label={`${preset.label}: ${preset.title}`}
                aria-pressed={selectedPreset?.key === preset.key}
                onClick={() => chooseDeck(preset.key)}
              >
                <span className="Home-presetTitle">
                  {preset.title}
                  <span aria-hidden="true">
                    {selectedPreset?.key === preset.key ? "●" : "○"}
                  </span>
                </span>
                <span className="Home-presetDescription">
                  {preset.description}
                </span>
              </button>
            ))}
          </div>
          <details className="Home-details">
            <summary>
              Customize individual cards{" "}
              <span>
                {selectedPreset ? selectedPreset.title : "Custom deck"}
              </span>
            </summary>
            <div className="Home-detailsBody">
              <div className="Home-optionalCards">
                <p className="Home-optionalCardsDescription">
                  Standard play includes Mermaids. Adjust individual cards for
                  your crew. All decks include the Tigress.
                </p>
                <div className="Home-cardOptions">
                  {OPTIONAL_CARDS.map((card) => (
                    <label key={card.key} className="Home-cardOption">
                      <input
                        type="checkbox"
                        checked={deckConfig[card.key] ?? false}
                        onChange={() => toggleCard(card.key)}
                      />
                      <span className="Home-cardOptionContent">
                        <span className="Home-cardName">{card.name}</span>
                        <span className="Home-cardDescription">
                          {card.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </details>
          <div className="Home-sectionHeading Home-sectionHeading--rounds">
            <span className="Home-step">02</span>
            <div>
              <h3>Make it your game</h3>
              <p>Ten rounds is the classic voyage. Short on time? Try five.</p>
            </div>
          </div>
          <label className="Home-scoringLabel" htmlFor="round-schedule">
            Round schedule
          </label>
          <select
            id="round-schedule"
            className="Home-scoringSelect"
            value={roundPreset}
            onChange={(event) => setRoundPreset(event.target.value)}
          >
            {Object.entries(ROUND_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label} · {preset.cards.length}{" "}
                {preset.cards.length === 1 ? "round" : "rounds"}
              </option>
            ))}
            <option value="custom">Custom schedule</option>
          </select>
          {roundPreset === "custom" && (
            <label className="Home-customRounds">
              Cards per round, separated by commas{" "}
              <input
                value={customRounds}
                onChange={(event) => setCustomRounds(event.target.value)}
                placeholder="2, 4, 6, 8, 10"
              />
            </label>
          )}
          <details className="Home-details">
            <summary>
              Scoring & special rules{" "}
              <span>
                {scoringMode === ScoringMode.Classic ? "Classic" : "Rascal"}
              </span>
            </summary>
            <div className="Home-detailsBody">
              <div className="Home-optionalCards">
                <label className="Home-cardOption">
                  <input
                    type="checkbox"
                    checked={pirateAbilities}
                    onChange={(event) =>
                      setPirateAbilities(event.target.checked)
                    }
                  />
                  <span className="Home-cardOptionContent">
                    <span className="Home-cardName">Pirate abilities</span>
                    <span className="Home-cardDescription">
                      Use each Pirate’s special power after winning a trick.
                    </span>
                  </span>
                </label>
                <label className="Home-scoringLabel" htmlFor="scoring-mode">
                  Scoring
                </label>
                <select
                  id="scoring-mode"
                  className="Home-scoringSelect"
                  value={scoringMode}
                  onChange={(event) =>
                    setScoringMode(event.target.value as ScoringMode)
                  }
                >
                  <option value={ScoringMode.Classic}>Classic</option>
                  <option value={ScoringMode.Rascal}>Rascal</option>
                </select>
                <p className="Home-scoringDescription">
                  {scoringMode === ScoringMode.Classic
                    ? "Score 20 per trick bid correctly. A zero bid wins or loses 10 points per card dealt; other missed bids lose 10 per trick off."
                    : "Everyone can earn 10 points per card dealt. An exact bid earns all, off by one earns half, and a larger miss earns none. Loot and Pirate wagers still require exact bids."}
                </p>
                <p className="Home-scoringDescription">
                  2–8 players with the base deck; up to nine with expansion
                  numbers. Rules are fixed for each voyage.
                </p>
                <label className="Home-cardOption">
                  <input
                    type="checkbox"
                    checked={tieBreakers}
                    onChange={(event) => setTieBreakers(event.target.checked)}
                  />
                  Play extra rounds to break a tie
                </label>
                {!tieBreakers && (
                  <p>House rule: tied leaders share the victory.</p>
                )}
                {scoringMode === ScoringMode.Rascal && (
                  <label className="Home-cardOption">
                    <input
                      type="checkbox"
                      checked={cannonball}
                      onChange={(event) => setCannonball(event.target.checked)}
                    />
                    Cannonball choices: choose steady Grapeshot or risk 15
                    points per card for an exact bid.
                  </label>
                )}
                <p>
                  Two-player games include Graybeard’s ghost and omit Loot, Wild
                  15, Walk the Plank, and 0/14 cards. Large crews deal fewer
                  cards when the deck requires it.
                </p>
              </div>
            </div>
          </details>
          {createFailed && (
            <p className="Home-createError" role="alert">
              Couldn’t create the game. Check that a custom schedule has 1–20
              rounds of 1–10 cards, then try again.
            </p>
          )}

          <button
            className="Home-createButton"
            onClick={() => void launchGame()}
            disabled={creating}
          >
            {creating ? "Launching Ship..." : "Start New Voyage"}
          </button>
          <p className="Home-createNote">
            Your invite link will be ready in the lobby.
          </p>
        </div>
      </section>
      {data.games.length > 0 && (
        <section className="Home-games" aria-labelledby="active-games-title">
          <div>
            <p className="Home-eyebrow">Already at sea</p>
            <h2 id="active-games-title">Open voyages</h2>
            <p>Return to your crew or watch a game unfold.</p>
          </div>
          <ul className="Home-gamesList">
            {data.games.map((game: string, index: number) => (
              <li key={game}>
                <Link to={`/game/${game}`} className="Home-gameLink">
                  <span className="Home-gameNumber">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    Voyage <small>{game.slice(0, 8)}</small>
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const DECK_PRESETS = [
  {
    key: "simple",
    title: "The essentials",
    label: "Simple deck",
    description: "A smooth first voyage. Pirates, numbers & Tigress.",
  },
  {
    key: "mermaids",
    title: "The original",
    label: "Standard deck",
    description: "The classic crew, with Mermaids in the mix.",
  },
  {
    key: "all",
    title: "Uncharted waters",
    label: "All base-game cards",
    description: "Release the Kraken, White Whale & Loot.",
  },
  {
    key: "expansion",
    title: "All hands on deck",
    label: "Everything, including the expansion",
    description: "Every card. Every twist. The full expansion.",
  },
] as const;

const ROUND_PRESETS: Record<string, { label: string; cards: number[] }> = {
  standard: { label: "Standard", cards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  evenKeeled: { label: "Even Keeled", cards: [2, 4, 6, 8, 10] },
  skipToTheBrawl: { label: "Skip to the Brawl", cards: [6, 7, 8, 9, 10] },
  swiftAndSalty: { label: "Swift-n-Salty", cards: [5, 5, 5, 5, 5] },
  broadside: { label: "Broadside Barrage", cards: Array(10).fill(10) },
  whirlpool: { label: "Whirlpool", cards: [9, 9, 7, 7, 5, 5, 3, 3, 1, 1] },
  bedtime: { label: "Past Your Bedtime", cards: [1] },
};
