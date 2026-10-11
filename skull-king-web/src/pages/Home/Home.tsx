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
  { key: "includeExpansion", name: "Expansion numbers & Mary Thorne", description: "Extra 7s and 8s, 0/14 choices, Wild 15, and Mary’s forced-card power" },
  { key: "includeFirstMate", name: "First Mate Con", description: "Beats Pirates and can use their captured powers" },
  { key: "includeStingray", name: "Spotted Stingray", description: "Lowest number wins, ignoring suits" },
  { key: "includeDavyJones", name: "Davy Jones’ Locker", description: "Removes sea creatures and earns 20 per creature on an exact bid" },
  { key: "includeWalkThePlank", name: "Walk the Plank", description: "Removes a Pirate at the end of the trick" },
  { key: "includeLastVolley", name: "The Last Volley", description: "Play an extra card, then skip the final trick" },
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

  const { data, loading, error } = useGamesQuery({ pollInterval: 2000 });

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
      includeKraken: (preset === "all" || preset === "expansion"),
      includeWhiteWhale: (preset === "all" || preset === "expansion"),
      includeLoot: (preset === "all" || preset === "expansion"),
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
      const roundSchedule = roundPreset === "custom" ? customRounds.split(",").map(value => Number(value.trim())) : ROUND_PRESETS[roundPreset].cards;
      if (!roundSchedule.length || roundSchedule.length > 20 || roundSchedule.some(value => !Number.isInteger(value) || value < 1 || value > 10)) throw new Error("Choose 1–20 rounds of 1–10 cards.");
      const result = await createGame({
        variables: { deckConfig, pirateAbilities, scoringMode, roundSchedule, tieBreakers, cannonball: scoringMode === ScoringMode.Rascal && cannonball },
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
            <button onClick={() => chooseDeck("expansion")}>Everything, including the expansion</button>
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
            2–8 players with the base deck; up to nine with expansion numbers. Rules are fixed for each voyage.
          </p>
          <label className="Home-scoringLabel" htmlFor="round-schedule">Round schedule</label>
          <select id="round-schedule" className="Home-scoringSelect" value={roundPreset} onChange={event => setRoundPreset(event.target.value)}>
            {Object.entries(ROUND_PRESETS).map(([key, preset]) => <option key={key} value={key}>{preset.label} · {preset.cards.join(", ")}</option>)}
            <option value="custom">Custom schedule</option>
          </select>
          {roundPreset === "custom" && <label>Cards per round, separated by commas <input value={customRounds} onChange={event => setCustomRounds(event.target.value)} placeholder="2, 4, 6, 8, 10" /></label>}
          <label className="Home-cardOption"><input type="checkbox" checked={tieBreakers} onChange={event => setTieBreakers(event.target.checked)} />Play extra rounds to break a tie</label>
          {!tieBreakers && <p>House rule: tied leaders share the victory.</p>}
          {scoringMode === ScoringMode.Rascal && <label className="Home-cardOption"><input type="checkbox" checked={cannonball} onChange={event => setCannonball(event.target.checked)} />Cannonball choices: choose steady Grapeshot or risk 15 points per card for an exact bid.</label>}
          <p>Two-player games include Graybeard’s ghost and omit Loot, Wild 15, Walk the Plank, and 0/14 cards. Large crews deal fewer cards when the deck requires it.</p>
        </div>

        {createFailed && (
          <p className="Home-createError" role="alert">
            Couldn’t create the game. Check that a custom schedule has 1–20 rounds of 1–10 cards, then try again.
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

const ROUND_PRESETS: Record<string, {label:string;cards:number[]}> = {
  standard: {label:"Standard",cards:[1,2,3,4,5,6,7,8,9,10]},
  evenKeeled: {label:"Even Keeled",cards:[2,4,6,8,10]},
  skipToTheBrawl: {label:"Skip to the Brawl",cards:[6,7,8,9,10]},
  swiftAndSalty: {label:"Swift-n-Salty",cards:[5,5,5,5,5]},
  broadside: {label:"Broadside Barrage",cards:Array(10).fill(10)},
  whirlpool: {label:"Whirlpool",cards:[9,9,7,7,5,5,3,3,1,1]},
  bedtime: {label:"Past Your Bedtime",cards:[1]},
};
