import { gql, useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { GamesQuery, NewGameMutation } from "../types/graphqlTypes";

export function Home() {
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);
  
  const { data, loading, error } = useQuery<GamesQuery>(
    gql`
      query Games {
        games
      }
    `
  );

  if (error) console.error(error);

  const [createGame] = useMutation<NewGameMutation>(
    gql`
      mutation NewGame {
        newGame
      }
    `,
    { refetchQueries: ["Games"] }
  );

  if (redirectTo) {
    return <Redirect to={`/game/${redirectTo}`} />;
  } else if (loading) {
    return <p>Loading...</p>;
  } else if (data?.games) {
    return (
      <>
        <GamesList games={data.games} />
        <button onClick={() => createGame().then(result => {
          setRedirectTo(result.data?.newGame);
        })}>Add Game</button>
      </>
    );
  } else {
    throw Error("unexpected missing data")
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
