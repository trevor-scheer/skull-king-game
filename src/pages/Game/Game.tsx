import { Navigate } from "react-router-dom";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { useGamePhaseQuery } from "../../types/graphqlTypes";
import { InGame } from "./InGame/InGame";
import { Lobby } from "./Lobby/Lobby";
import { Spectator } from "./Spectator/Spectator";

export function Game() {
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [playerToken] = usePlayerToken();

  // TODO: error handling
  const { data, loading } = useGamePhaseQuery({
    variables: { gameId },
    pollInterval: 2000,
  });

  if (loading) return <div>Loading...</div>;

  // No game found
  if (!data?.state) {
    return <Navigate to="/" />;
  }

  if (data.state.phase === "setup") return <Lobby />;

  return playerToken ? <InGame /> : <Spectator />;
}
