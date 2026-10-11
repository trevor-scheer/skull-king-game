import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useState } from "react";
import { useGameId } from "../../../hooks/useGameId";
import {
  usePlayersQuery,
  useStartGameMutation,
} from "../../../types/graphqlTypes";
import "./StartGame.scss";

export const StartGame: React.FunctionComponent = function () {
  const gameId = useGameId();
  const [playerToken] = usePlayerToken();
  const [error, setError] = useState<string | null>(null);

  const { loading, data } = usePlayersQuery({
    variables: { gameId: gameId! },
    pollInterval: 10000,
  });
  const [startGame, { loading: starting }] = useStartGameMutation({
    variables: { gameId: gameId!, playerToken: playerToken! },
  });

  const playerCount = data?.state?.players?.length ?? 0;
  const disabled = loading || starting || playerCount < 2;

  return (
    <div className="StartGame">
      <p className="StartGame-hint">
        {playerCount < 2
          ? `Need at least 2 players to set sail (${playerCount}/2)`
          : `${playerCount} crew members ready!`}
      </p>
      {error && <p role="alert">{error}</p>}
      <button
        className="StartGame-button"
        onClick={() => { setError(null); void startGame().catch(error => setError(error.message)); }}
        disabled={disabled}
      >
        {starting ? "Setting Sail..." : "Set Sail!"}
      </button>
    </div>
  );
};
