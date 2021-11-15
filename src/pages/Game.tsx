import { gql, useQuery } from "@apollo/client";
import { Redirect } from "react-router-dom";
import { usePlayerToken } from "../hooks/PlayerTokenContext";
import { useGameId } from "../hooks/useGameId";
import { InGame } from "./Game/InGame";
import { Lobby } from "./Game/Lobby";
import { Spectator } from "./Game/Spectator";

export function Game() {
  const gameId = useGameId();
  const [playerToken] = usePlayerToken();

  // TODO: error handling
  const { data, loading } = useQuery(
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

  if (data.state.phase === "setup") return <Lobby />;

  return playerToken ? <InGame /> : <Spectator />;
}
