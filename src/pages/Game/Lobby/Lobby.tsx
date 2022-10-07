import { gql, useQuery } from "@apollo/client";
import { usePlayerToken } from "../../../hooks/PlayerTokenContext";
import { useGameId } from "../../../hooks/useGameId";
import { LobbyQueryQuery } from "../../../types/graphqlTypes";
import { JoinGame } from "../JoinGame/JoinGame";
import { StartGame } from "../StartGame/StartGame";
import "./Lobby.scss";

// gql`
//   query LobbyQuery($gameId: String!, $playerToken: String) {
//     state(gameId: $gameId, playerToken: $playerToken) {
//       id
//       players {
//         id
//         name
//       }
//     }
//   }
// `;

export const Lobby: React.FunctionComponent = function () {
  const gameId = useGameId() ?? ""; // TODO: hacky fallback
  const [playerToken, setToken] = usePlayerToken();
  const variables = { gameId, playerToken };

  const { data, loading, error } = useQuery<LobbyQueryQuery>(
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
