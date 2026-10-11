import { useRoomConnection } from "../../hooks/useRoomConnection";
import { Link } from "react-router-dom";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { useGamePhaseQuery } from "../../types/graphqlTypes";
import { InGame } from "./InGame/InGame";
import { Lobby } from "./Lobby/Lobby";
import { PostGame } from "./PostGame/PostGame";
import { Spectator } from "./Spectator/Spectator";

export function Game() {
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [playerToken] = usePlayerToken();

  const connected = useRoomConnection(gameId);
  const { data, loading, error, refetch } = useGamePhaseQuery({
    variables: { gameId },
    pollInterval: 2000,
  });

  if (error && !data) return <p role="alert">Connection interrupted. Your seat is saved. <button onClick={() => void refetch().catch(() => undefined)}>Reconnect</button></p>;
  if (loading && !data) return <div>Loading...</div>;

  // No game found
  if (!data?.state) {
    return <p>This room is no longer available. <Link to="/">Start a new voyage</Link></p>;
  }

  return <>
    {!connected && <p role="status">Reconnecting live updates… Your seat is saved; checking for changes.</p>}
    {data.state.phase === "setup" ? <Lobby /> : data.state.phase === "postgame" ? <PostGame /> : playerToken ? <InGame /> : <Spectator />}
  </>;
}
