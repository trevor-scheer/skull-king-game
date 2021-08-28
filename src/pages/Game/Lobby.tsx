import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { usePlayerToken } from "../../hooks/usePlayerToken";
import { JoinGame } from "./JoinGame";
import { StartGame } from "./StartGame";

export const Lobby: React.FunctionComponent = function () {
  const { id: gameId } = useParams<{ id: string }>();
  const [playerToken, setToken] = usePlayerToken();
  const variables = { gameId, playerToken };

  const { data, loading, error } = useQuery(gameStateQuery(), {
    variables,
    pollInterval: 2000,
  });

  if (loading) return <div>Loading...</div>;

  // TODO: any
  return (
    <div>
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

function gameStateQuery() {
  return gql`
    query GameStateQuery($gameId: String!, $playerToken: String) {
      state(gameId: $gameId, playerToken: $playerToken) {
        id
        players {
          name
        }
      }
    }
  `;
}
