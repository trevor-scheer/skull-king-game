import { useEffect } from "react";
import { RoomControls } from "./Practice/PracticeControls";
import { AccountResume } from "../Account/AccountResume";
import { SeatRecovery } from "./SeatRecovery/SeatRecovery";
import { useRoomConnection } from "../../hooks/useRoomConnection";
import { Link } from "react-router-dom";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { useGamePhaseQuery } from "../../types/graphqlTypes";
import { InGame } from "./InGame/InGame";
import { Lobby } from "./Lobby/Lobby";
import { PostGame } from "./PostGame/PostGame";

export function Game() {
  const gameId = useGameId() ?? "";
  const [playerToken] = usePlayerToken();

  const connected = useRoomConnection(gameId);
  const { data, loading, error, refetch } = useGamePhaseQuery({
    variables: { gameId },
    pollInterval: 10000,
  });

  useEffect(() => {
    if (data?.state?.phase)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [data?.state?.phase]);

  if (error && !data)
    return (
      <section className="Game-message" role="alert">
        <h1>Connection interrupted</h1>
        <p>Your seat is saved. Reconnect to return to the table.</p>
        <button onClick={() => void refetch().catch(() => undefined)}>
          Reconnect
        </button>
      </section>
    );
  if (loading && !data)
    return (
      <div className="Game-message" role="status">
        Preparing your table…
      </div>
    );

  // No game found
  if (!data?.state) {
    return (
      <section className="Game-message">
        <h1>This voyage has ended</h1>
        <p>This room is no longer available.</p>
        <Link to="/">Start a new voyage →</Link>
      </section>
    );
  }

  const utilities = (
    <div className="Game-utilities">
      {data.state.phase === "play" && playerToken && <RoomControls />}
      <AccountResume gameId={gameId} phase={data.state.phase} />
      <SeatRecovery gameId={gameId} />
    </div>
  );

  return (
    <div
      className={data.state.phase === "play" ? "Game Game--playing" : "Game"}
    >
      {!connected && (
        <p className="Game-connection" role="status">
          Reconnecting live updates… Your seat is saved; checking for changes.
        </p>
      )}
      {data.state.phase === "setup" ? (
        <Lobby />
      ) : data.state.phase === "postgame" ? (
        <PostGame />
      ) : (
        <InGame spectator={!playerToken} utilities={utilities} />
      )}
      {data.state.phase !== "play" && utilities}
    </div>
  );
}
