import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useGamesQuery, useNewGameMutation, DeckConfigInput } from "../../types/graphqlTypes";
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
    description: "Beat Skull King, lose to Pirates",
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
  const [deckConfig, setDeckConfig] = useState<DeckConfigInput>({
    includeMermaids: false,
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
          <h2 className="Home-sectionTitle">Optional Cards</h2>
          <p className="Home-optionalCardsDescription">
            Select expansion cards to include in your game
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
                  <span className="Home-cardDescription">{card.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button
          className="Home-createButton"
          onClick={() =>
            createGame({ variables: { deckConfig } }).then((result) => {
              setRedirectTo(result.data?.newGame);
            })
          }
          disabled={creating}
        >
          {creating ? "Launching Ship..." : "Start New Voyage"}
        </button>
      </div>
    </div>
  );
}
