import { gql, useMutation, useQuery } from "@apollo/client";
import { Link } from "react-router-dom";

export function Home() {
  const { data, loading, error } = useQuery(
    gql`
      query Games {
        games
      }
    `
  );

  const [createGame, _createGameResult] = useMutation(
    gql`
      mutation NewGame {
        newGame
      }
    `,
    { refetchQueries: ["Games"] }
  );

  if (loading) {
    return <p>Loading...</p>;
  } else {
    return (
      <>
        <GamesList games={data.games} />
        <button onClick={() => createGame()}>Add Game</button>
      </>
    );
  }
}

const GamesList: React.FunctionComponent<{ games: number[] }> = function ({
  games,
}: {
  games: number[];
}) {
  return (
    <ul>
      {games.map((game: number) => (
        <li key={game}>
          <Link to={`/game/${game}`}>{game}</Link>
        </li>
      ))}
    </ul>
  );
};
