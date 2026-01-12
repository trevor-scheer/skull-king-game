import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { useLobbyQueryQuery } from "../../../types/graphqlTypes";
import { JoinGame } from "../JoinGame/JoinGame";
import { StartGame } from "../StartGame/StartGame";
import "./Lobby.scss";

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [playerToken, setToken] = usePlayerToken();
  const variables = { gameId, playerToken };

  const { data, loading, error } = useLobbyQueryQuery({
    variables,
    pollInterval: 2000,
  });

  function onJoin(playerToken: string | null) {
    if (!playerToken) return; // TODO: throw error?
    setToken(playerToken, gameId);
  }

  if (error) console.error(error);

  if (loading) return <div>Loading...</div>;

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
