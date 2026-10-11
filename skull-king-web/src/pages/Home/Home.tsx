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
];

export function Home() {
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);
  const [pirateAbilities, setPirateAbilities] = useState(false);
  const [scoringMode, setScoringMode] = useState(ScoringMode.Classic);
  const [createFailed, setCreateFailed] = useState(false);
  const [deckConfig, setDeckConfig] = useState<DeckConfigInput>({
    includeMermaids: true,
    includeKraken: false,
    includeWhiteWhale: false,
    includeLoot: false,
  });

  const { data, loading, error } = useGamesQuery({ pollInterval: 2000 });

  if (error) console.error(error);

  const [createGame, { loading: creating }] = useNewGameMutation({
    refetchQueries: ["Games"],
  });

  const toggleCard = (key: keyof DeckConfigInput) => {
    setDeckConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const chooseDeck = (preset: "simple" | "mermaids" | "all") => {
    setDeckConfig({
      includeMermaids: preset !== "simple",
      includeKraken: preset === "all",
      includeWhiteWhale: preset === "all",
      includeLoot: preset === "all",
    });
  };

  async function launchGame() {
    setCreateFailed(false);
    try {
      const result = await createGame({
        variables: { deckConfig, pirateAbilities, scoringMode },
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

  return (
    <div className="Home">
      <div className="Home-header">
        <h1 className="Home-title">Skull King</h1>
        <p className="Home-tagline">A pirate's trick-taking adventure</p>
      </div>

      <div className="Home-content">
        {data.games.length > 0 && (
          <div className="Home-games">
            <h2 className="Home-sectionTitle">Active Games</h2>
            <ul className="Home-gamesList">
              {data.games.map((game: string) => (
                <li key={game}>
                  <Link to={`/game/${game}`} className="Home-gameLink">
                    <span className="Home-gameIcon">⛵</span>
                    <span className="Home-gameId">{game}</span>
                    <span className="Home-gameArrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="Home-optionalCards">
          <h2 className="Home-sectionTitle">Cards in the Deck</h2>
          <p className="Home-optionalCardsDescription">
            Standard play includes Mermaids. Adjust individual cards for your crew.
            All decks include the Tigress.
          </p>
          <div className="Home-presets" role="group" aria-label="Deck presets">
            <button onClick={() => chooseDeck("simple")}>Simple deck</button>
            <button onClick={() => chooseDeck("mermaids")}>Standard deck</button>
            <button onClick={() => chooseDeck("all")}>
              All base-game cards
            </button>
          </div>
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

        <div className="Home-optionalCards">
          <h2 className="Home-sectionTitle">Rules for Your Crew</h2>
          <label className="Home-cardOption">
            <input
              type="checkbox"
              checked={pirateAbilities}
              onChange={(event) => setPirateAbilities(event.target.checked)}
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
            Ten rounds · 2–6 players · Rules are fixed when the game is created.
          </p>
          <p className="Home-scoringDescription">
            Current house rules: two-player games omit Graybeard, and tied games
            end after ten rounds without a tiebreaker.
          </p>
        </div>

        {createFailed && (
          <p className="Home-createError" role="alert">
            Couldn’t create the game. Your settings are saved here—try again.
          </p>
        )}

        <button
          className="Home-createButton"
          onClick={() => void launchGame()}
          disabled={creating}
        >
          {creating ? "Launching Ship..." : "Start New Voyage"}
        </button>
      </div>
    </div>
  );
}
