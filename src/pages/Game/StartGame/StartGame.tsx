import { useGameId } from "../../../hooks/useGameId";
import {
  usePlayersQuery,
  useStartGameMutation,
} from "../../../types/graphqlTypes";

export const StartGame: React.FunctionComponent = function () {
  const gameId = useGameId();

  const { loading, data } = usePlayersQuery({
    variables: { gameId: gameId! },
    pollInterval: 2000,
  });
  const [startGame] = useStartGameMutation({ variables: { gameId: gameId! } });

  const disabled = loading || (data?.state?.players?.length ?? 0) < 2;

  return (
    <button onClick={() => startGame()} disabled={disabled}>
      Start Game
    </button>
  );
};
