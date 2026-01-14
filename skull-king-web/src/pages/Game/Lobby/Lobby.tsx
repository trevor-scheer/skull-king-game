import { ErrorMessage } from "../../../components/ErrorMessage";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useLobbyQueryQuery } from "../../../types/graphqlTypes";
import { JoinGame } from "../JoinGame/JoinGame";
import { StartGame } from "../StartGame/StartGame";
import "./Lobby.scss";

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId();
  const [playerToken, setToken] = usePlayerToken();
  const variables = { gameId: gameId ?? "", playerToken };

  const { data, loading, error, refetch } = useLobbyQueryQuery({
    variables,
    pollInterval: 2000,
    skip: !gameId,
  });

  function onJoin(playerToken: string | null) {
    if (!playerToken || !gameId) return;
    setToken(playerToken, gameId);
  }

  if (loading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="Lobby Lobby--error">
        <ErrorMessage error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="Lobby">
      <p className="Lobby-header">Players in lobby</p>
      <ol className="Lobby-playerList">
        {data?.state?.players.map((player) => (
          <li key={player.name}>{player.name}</li>
        ))}
      </ol>
      {playerToken ? <StartGame /> : <JoinGame onJoin={onJoin} />}
    </div>
  );
};
