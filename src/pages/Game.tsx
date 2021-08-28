import { gql, useQuery } from "@apollo/client";
import { Redirect, useParams } from "react-router-dom";
import { InGame } from "./Game/InGame";
import { Lobby } from "./Game/Lobby";

export function Game() {
  const { id: gameId } = useParams<{ id: string }>();
  const { data, loading, error } = useQuery(
    gql`
      query GamePhaseQuery($gameId: String!) {
        state(gameId: $gameId) {
          id
          phase
        }
      }
    `,
    {
      variables: { gameId },
      pollInterval: 2000,
    }
  );

  if (loading) return <div>Loading...</div>;

  // No game found
  if (!data?.state) return <Redirect to="/" />;

  return data.state.phase === "setup" ? <Lobby /> : <InGame />;
}
