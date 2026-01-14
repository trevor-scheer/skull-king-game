import { Navigate } from "react-router-dom";
import { ErrorMessage } from "../../components/ErrorMessage";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { useGamePhaseQuery } from "../../types/graphqlTypes";
import { InGame } from "./InGame/InGame";
import { Lobby } from "./Lobby/Lobby";
import { PostGame } from "./PostGame/PostGame";
import { Spectator } from "./Spectator/Spectator";

export function Game() {
  const gameId = useGameId();
  const [playerToken] = usePlayerToken();

  const { data, loading, error, refetch } = useGamePhaseQuery({
    variables: { gameId: gameId ?? "" },
    pollInterval: 2000,
    skip: !gameId,
  });

  if (!gameId) {
    return <Navigate to="/" />;
  }

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div style={{ padding: "2rem" }}>
        <ErrorMessage error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  // No game found
  if (!data?.state) {
    return <Navigate to="/" />;
  }

  if (data.state.phase === "setup") return <Lobby />;

  if (data.state.phase === "postgame") return <PostGame />;

  return playerToken ? <InGame /> : <Spectator />;
}
