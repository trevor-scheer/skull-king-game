import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useGamesQuery, useNewGameMutation } from "../../types/graphqlTypes";
import "./Home.scss";

export function Home() {
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);

  const { data, loading, error } = useGamesQuery({ pollInterval: 2000 });

  if (error) console.error(error);

  const [createGame, { loading: creating }] = useNewGameMutation({
    refetchQueries: ["Games"],
  });

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

        <button
          className="Home-createButton"
          onClick={() =>
            createGame().then((result) => {
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
