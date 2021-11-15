import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../hooks/PlayerTokenContext";
import { useGameId } from "../../hooks/useGameId";
import { JoinGame } from "./JoinGame";
import { StartGame } from "./StartGame";

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId();
  const [playerToken, setToken] = usePlayerToken();
  const variables = { gameId, playerToken };

  const { data, loading, error } = useQuery(
    gql`
      query LobbyQuery($gameId: String!, $playerToken: String) {
        state(gameId: $gameId, playerToken: $playerToken) {
          id
          players {
            id
            name
          }
        }
      }
    `,
    {
      variables,
      pollInterval: 2000,
    }
  );
  if (error) console.error(error);

  if (loading) return <div>Loading...</div>;

  // TODO: any
  return (
    <div>
      <p>{playerToken}</p>
      {JSON.stringify(data, null, 2)}
      <ol>
        {data.state.players.map((player: any) => (
          <li key={player.name}>{player.name}</li>
        ))}
      </ol>
      {playerToken ? <StartGame /> : <JoinGame onJoin={setToken} />}
    </div>
  );
};
