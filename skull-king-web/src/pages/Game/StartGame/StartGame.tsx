import { useGameId } from "../../../hooks/useGameId";
import {
  usePlayersQuery,
  useStartGameMutation,
} from "../../../types/graphqlTypes";
import "./StartGame.scss";

export const StartGame: React.FunctionComponent = function () {
  const gameId = useGameId();

  const { loading, data } = usePlayersQuery({
    variables: { gameId: gameId! },
    pollInterval: 2000,
  });
  const [startGame, { loading: starting }] = useStartGameMutation({
    variables: { gameId: gameId! },
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
      <button
        className="StartGame-button"
        onClick={() => startGame()}
        disabled={disabled}
      >
        {starting ? "Setting Sail..." : "Set Sail!"}
      </button>
    </div>
  );
};
