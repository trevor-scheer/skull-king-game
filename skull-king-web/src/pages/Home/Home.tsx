import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useGamesQuery, useNewGameMutation } from "../../types/graphqlTypes";

export function Home() {
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);

  const { data, loading, error } = useGamesQuery({ pollInterval: 2000 });

  if (error) console.error(error);

  const [createGame] = useNewGameMutation({ refetchQueries: ["Games"] });

  if (redirectTo) {
    return <Navigate to={`/game/${redirectTo}`} />;
  } else if (loading) {
    return <p>Loading...</p>;
  } else if (data?.games) {
    return (
      <>
        <GamesList games={data.games} />
        <button
          onClick={() =>
            createGame().then((result) => {
              setRedirectTo(result.data?.newGame);
            })
          }
        >
          Add Game
        </button>
      </>
    );
  } else {
    throw Error("unexpected missing data");
  }
}

const GamesList: React.FunctionComponent<{ games: string[] }> = function ({
  games,
}: {
  games: string[];
}) {
  return (
    <ul>
      {games.map((game: string) => (
        <li key={game}>
          <Link to={`/game/${game}`}>{game}</Link>
        </li>
      ))}
    </ul>
  );
};
