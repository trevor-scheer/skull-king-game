import { gql, useMutation, useQuery } from "@apollo/client";
import { useGameId } from "../../../hooks/useGameId";

export const StartGame: React.FunctionComponent = function () {
  const gameId = useGameId();

  const { loading, data } = useQuery(
    gql`
      query Players($gameId: String!) {
        state(gameId: $gameId) {
          id
          players {
            id
            name
          }
        }
      }
    `,
    { variables: { gameId } }
  );

  const [startGame] = useMutation(
    gql`
      mutation StartGame($gameId: String!) {
        startGame(gameId: $gameId)
      }
    `,
    { variables: { gameId } }
  );

  return (
    <button
      onClick={() => startGame()}
      disabled={loading || data.state.players.length < 2}
    >
      Start Game
    </button>
  );
};
