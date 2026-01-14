import { useState } from "react";
import { ErrorMessage } from "../../../components/ErrorMessage";
import { useGameId } from "../../../hooks/useGameId";
import {
  usePlayersQuery,
  useStartGameMutation,
} from "../../../types/graphqlTypes";
import "./StartGame.scss";

export const StartGame: React.FunctionComponent = function () {
  const gameId = useGameId();
  const [startError, setStartError] = useState<Error | null>(null);

  const { loading, data, error, refetch } = usePlayersQuery({
    variables: { gameId: gameId! },
    pollInterval: 2000,
  });
  const [startGame, { loading: starting }] = useStartGameMutation({
    variables: { gameId: gameId! },
    onError: (error) => setStartError(error),
  });

  if (error) {
    return (
      <div className="StartGame StartGame--error">
        <ErrorMessage error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  const playerCount = data?.state?.players?.length ?? 0;
  const disabled = loading || starting || playerCount < 2;

  return (
    <div className="StartGame">
      {startError && (
        <ErrorMessage error={startError} onRetry={() => setStartError(null)} />
      )}
      <p className="StartGame-hint">
        {playerCount < 2
          ? `Need at least 2 players to set sail (${playerCount}/2)`
          : `${playerCount} crew members ready!`}
      </p>
      <button
        className="StartGame-button"
        onClick={() => {
          setStartError(null);
          startGame();
        }}
        disabled={disabled}
      >
        {starting ? "Setting Sail..." : "Set Sail!"}
      </button>
    </div>
  );
};
